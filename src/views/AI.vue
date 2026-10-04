<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useSpeechRecognition } from "@vueuse/core";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { isJSON } from "@/validation/isJSON";
import pcmProcessorSource from "@/audio/realtimePcmProcessor.js?raw";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import moment from "moment-timezone";

type AiImageResponse = types.KeyValue & {
	image_mime?: string | number;
	image_base64?: string;
};

const API = new APIClass();
const appStore = useAppStore();
const aiTab = ref("image");
const aiIsLoading = ref(false);
const aiImageResponse = ref<AiImageResponse[]>([]);
const aiPrompt = ref("");
const aiKeydown = async (event: KeyboardEvent) => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		aiIsLoading.value = true;
		await aiRequest().finally(() => {
			aiIsLoading.value = false;
		});
	}
};
const chatSubmit = async () => {
	aiIsLoading.value = true;
	await aiRequest().finally(() => {
		aiIsLoading.value = false;
	});
};
const aiRequest = async () => {
	try {
		let aiResponse = await API.generateImage(aiPrompt.value);
		if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
			console.log("ai response", JSON.parse(JSON.stringify(aiResponse)));
		}
		if (
			aiResponse.success == true &&
			aiResponse.results &&
			Array.isArray(aiResponse.results) &&
			aiResponse.results.length > 0
		) {
			if (aiResponse.results[0].response || aiResponse.results[0].media || aiResponse.results[0].prompt_id) {
				if (llmResponse.results[0].tts?.base64) {
					appStore.avatarTTS = JSON.parse(JSON.stringify(aiResponse.results[0].tts));
				} else {
					appStore.avatarTTS = null;
				}
				appStore.avatarResponse = aiResponse.results[0].response || "";
				appStore.prompt = "";
				appStore.avatarIsLoading = false;
			} else {
				appStore.avatarResponse = "";
				appStore.avatarTTS = null;
			}
		}
	} catch (error) {
		// Prevent parser/runtime failure paths from failing silently and keep diagnostics visible.
		console.error("chatRequest failed:", error);
	}
};

const switchAiTab = async (tab: string) => {
	aiTab.value = tab;
};

const realtimeVideo = ref<HTMLVideoElement | null>(null);
const realtimeCanvas = ref<HTMLCanvasElement | null>(null);
const realtimeRunning = ref(false);
const realtimeStarting = ref(false);
const realtimeError = ref("");
const realtimeScene = ref("");
const realtimePeople = ref("");
const realtimeEmotion = ref("");
const realtimeHeard = ref("");
const realtimeTranscript = ref("");
const realtimeReply = ref("");
let realtimeSocket: WebSocket | null = null;
let realtimeStream: MediaStream | null = null;
let realtimeAudio: AudioContext | null = null;
let realtimeFrameTimer: number | null = null;
let realtimeGeneration = 0;
let pcmProcessorUrl: string | null = null;

const readUserJwt = (): string => {
	const raw = localStorage.getItem(appStore.loginTokenKey);
	if (!raw || !isJSON(raw)) {
		return "";
	}
	const parsed = JSON.parse(raw);
	return typeof parsed.user_jwt === "string" ? parsed.user_jwt : "";
};

const realtimeSocketUrl = (): string => {
	// Build-time env, not globalVars: the realtime socket must not depend on the start-app response.
	return `${process.env.VUE_APP_ENV_LLM_WSS_URL}/realtime`;
};

const sendRealtimePacket = (kind: number, payload: Uint8Array) => {
	if (!realtimeSocket || realtimeSocket.readyState !== WebSocket.OPEN) {
		return;
	}
	const packet = new Uint8Array(payload.byteLength + 1);
	packet[0] = kind;
	packet.set(payload, 1);
	realtimeSocket.send(packet);
};

const captureRealtimeFrame = () => {
	const video = realtimeVideo.value;
	const canvas = realtimeCanvas.value;
	if (!video || !canvas || video.readyState < 2) {
		return;
	}
	if (canvas.width !== 640) {
		canvas.width = 640;
	}
	if (canvas.height !== 480) {
		canvas.height = 480;
	}
	const context = canvas.getContext("2d");
	if (!context) {
		return;
	}
	context.drawImage(video, 0, 0, 640, 480);
	canvas.toBlob(
		(blob) => {
			if (!blob) {
				return;
			}
			blob.arrayBuffer().then((buffer) => {
				sendRealtimePacket(0x01, new Uint8Array(buffer));
			});
		},
		"image/jpeg",
		0.7,
	);
};

const pcmProcessorModuleUrl = (): string => {
	if (!pcmProcessorUrl) {
		// Build the worklet from the page so the browser does not have to fetch a separate script.
		const blob = new Blob([pcmProcessorSource], { type: "application/javascript" });
		pcmProcessorUrl = URL.createObjectURL(blob);
	}
	return pcmProcessorUrl;
};

const startScriptProcessor = (audioContext: AudioContext, source: MediaStreamAudioSourceNode) => {
	const processor = audioContext.createScriptProcessor(4096, 1, 1);
	let fraction = 0;
	const pending: number[] = [];
	const ratio = audioContext.sampleRate / 16000;
	processor.onaudioprocess = (event: AudioProcessingEvent) => {
		const channel = event.inputBuffer.getChannelData(0);
		for (let index = 0; index < channel.length; index += 1) {
			fraction += 1;
			if (fraction < ratio) {
				continue;
			}
			fraction -= ratio;
			pending.push(Math.max(-1, Math.min(1, channel[index])));
		}
		if (pending.length >= 1600) {
			const chunk = pending.splice(0, 1600);
			const pcm = new Int16Array(chunk.length);
			for (let index = 0; index < chunk.length; index += 1) {
				pcm[index] = Math.max(-32768, Math.min(32767, Math.round(chunk[index] * 32767)));
			}
			sendRealtimePacket(0x02, new Uint8Array(pcm.buffer));
		}
	};
	// A silent output keeps the processor running without playing the microphone back.
	const mute = audioContext.createGain();
	mute.gain.value = 0;
	source.connect(processor);
	processor.connect(mute);
	mute.connect(audioContext.destination);
};

const startRealtimeAudio = async (stream: MediaStream) => {
	const audioContext = new AudioContext();
	realtimeAudio = audioContext;
	if (audioContext.state === "suspended") {
		await audioContext.resume();
	}
	const source = audioContext.createMediaStreamSource(stream);
	try {
		await audioContext.audioWorklet.addModule(pcmProcessorModuleUrl());
		const node = new AudioWorkletNode(audioContext, "realtime-pcm-processor");
		node.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
			sendRealtimePacket(0x02, new Uint8Array(event.data));
		};
		source.connect(node);
	} catch {
		// Some browsers reject the worklet module. Downsample on this thread instead of failing Start.
		startScriptProcessor(audioContext, source);
	}
};

const handleRealtimeMessage = (event: MessageEvent) => {
	if (typeof event.data !== "string" || !isJSON(event.data)) {
		return;
	}
	const message = JSON.parse(event.data);
	if (message.type === "evaluation") {
		realtimeScene.value = message.scene || "";
		realtimePeople.value = message.people || "";
		realtimeEmotion.value = message.emotion || "";
		realtimeHeard.value = message.heard || "";
		return;
	}
	if (message.type === "transcript") {
		realtimeTranscript.value = message.text || "";
		return;
	}
	if (message.type === "reply") {
		realtimeReply.value = typeof message.response === "string" ? message.response : "";
		appStore.avatarResponse = realtimeReply.value;
		if (message.tts?.base64) {
			appStore.avatarTTS = JSON.parse(JSON.stringify(message.tts));
		} else {
			appStore.avatarTTS = null;
		}
		return;
	}
	if (message.type === "error") {
		realtimeError.value = message.error || "Realtime evaluation failed";
	}
};

const stopRealtime = () => {
	realtimeGeneration += 1;
	const socket = realtimeSocket;
	realtimeSocket = null;
	if (socket) {
		socket.onmessage = null;
		socket.onclose = null;
		socket.onerror = null;
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: "stop" }));
		}
		socket.close();
	}
	if (realtimeFrameTimer !== null) {
		window.clearInterval(realtimeFrameTimer);
		realtimeFrameTimer = null;
	}
	if (realtimeAudio) {
		void realtimeAudio.close();
		realtimeAudio = null;
	}
	if (realtimeStream) {
		for (const track of realtimeStream.getTracks()) {
			track.stop();
		}
		realtimeStream = null;
	}
	if (realtimeVideo.value) {
		realtimeVideo.value.srcObject = null;
	}
	realtimeRunning.value = false;
};

// Live camera frames and microphone audio are streamed to /realtime.
// Replies reuse the avatar TTS player. Frames and audio are not stored in the page.
const startRealtime = async () => {
	if (realtimeRunning.value || realtimeStarting.value) {
		return;
	}
	realtimeStarting.value = true;
	realtimeError.value = "";
	const userJwt = readUserJwt();
	if (!userJwt) {
		realtimeError.value = "Sign in before starting the camera.";
		realtimeStarting.value = false;
		return;
	}
	stopRealtime();
	const generation = realtimeGeneration;
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true,
		});
		if (generation !== realtimeGeneration) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			return;
		}
		realtimeStream = stream;
		if (realtimeVideo.value) {
			realtimeVideo.value.srcObject = stream;
			await realtimeVideo.value.play();
		}
		// Capture audio before opening the socket. A socket close was aborting the worklet load.
		await startRealtimeAudio(stream);
		if (generation !== realtimeGeneration) {
			return;
		}
		const socket = new WebSocket(realtimeSocketUrl());
		realtimeSocket = socket;
		await new Promise<void>((resolve, reject) => {
			socket.onopen = () => {
				resolve();
			};
			socket.onerror = () => {
				reject(new Error("Realtime socket failed"));
			};
		});
		if (generation !== realtimeGeneration) {
			return;
		}
		socket.onmessage = handleRealtimeMessage;
		socket.onerror = () => {
			realtimeError.value = "Realtime socket failed";
		};
		socket.onclose = () => {
			if (realtimeSocket === socket) {
				if (!realtimeError.value) {
					realtimeError.value = "Realtime socket closed";
				}
				stopRealtime();
			}
		};
		socket.send(JSON.stringify({ type: "start", user_jwt: userJwt }));
		if (generation !== realtimeGeneration) {
			return;
		}
		realtimeFrameTimer = window.setInterval(captureRealtimeFrame, 500);
		realtimeRunning.value = true;
	} catch (error) {
		if (generation === realtimeGeneration) {
			stopRealtime();
			realtimeError.value = error instanceof Error ? error.message : "Could not start the camera";
		}
	} finally {
		realtimeStarting.value = false;
	}
};

onMounted(async () => {});

onBeforeUnmount(() => {
	stopRealtime();
});
</script>

<template>
	<v-tabs v-model="aiTab" @update:modelValue="async () => await switchAiTab(aiTab)" class="aiTabs">
		<v-tab value="image">Image</v-tab>
		<v-tab value="text">Text</v-tab>
		<v-tab value="real-time">Real-Time</v-tab>
	</v-tabs>
	<v-tabs-window v-model="aiTab">
		<v-tabs-window-item value="image">
			<div class="real-time-container">
				<div class="real-time-content">
					<div class="real-time-input">
						<textarea
							v-model="aiPrompt"
							id="promptInput"
							@keydown="async (event) => await aiKeydown(event)"
							placeholder="Enter a prompt to generate an image..."
						></textarea>
						<div class="submitWrapper">
							<button class="button primary" @click="async (event) => aiRequest()" :disabled="!aiPrompt">
								Generate
							</button>
							<Transition name="fade">
								<div class="avatarLoader" v-if="aiIsLoading">
									<Loader class="spin" />
								</div>
							</Transition>
						</div>
						<div class="imageContainer" v-if="aiImageResponse.length > 0">
							<img
								v-for="image in aiImageResponse"
								:src="`data:${image.image_mime};base64,${image.image_base64}`"
							/>
						</div>
					</div>
				</div>
			</div>
		</v-tabs-window-item>
		<v-tabs-window-item value="text">
			<textarea
				v-model="aiPrompt"
				id="promptInput"
				@keydown="async (event) => await aiKeydown(event)"
				placeholder="Enter a prompt to generate text..."
			></textarea>
			<div class="submitWrapper">
				<button class="button primary" @click="async (event) => aiRequest()" :disabled="!aiPrompt">
					Generate
				</button>
				<Transition name="fade">
					<div class="avatarLoader" v-if="aiIsLoading">
						<Loader class="spin" />
					</div>
				</Transition>
			</div>
		</v-tabs-window-item>
		<v-tabs-window-item value="real-time">
			<div class="real-time-container">
				<div class="real-time-content">
					<video ref="realtimeVideo" class="realtimePreview" autoplay muted playsinline></video>
					<canvas ref="realtimeCanvas" class="realtimeCanvas"></canvas>
					<div class="submitWrapper">
						<button
							class="button primary"
							type="button"
							@click="startRealtime"
							:disabled="realtimeRunning || realtimeStarting"
						>
							Start
						</button>
						<button class="button" type="button" @click="stopRealtime" :disabled="!realtimeRunning">
							Stop
						</button>
					</div>
					<p v-if="realtimeError" class="realtimeError">{{ realtimeError }}</p>
					<div class="realtimeEvaluation">
						<p><strong>Scene</strong> {{ realtimeScene }}</p>
						<p><strong>People</strong> {{ realtimePeople }}</p>
						<p><strong>Emotion</strong> {{ realtimeEmotion }}</p>
						<p><strong>Heard</strong> {{ realtimeHeard }}</p>
						<p><strong>Transcript</strong> {{ realtimeTranscript }}</p>
						<p><strong>Reply</strong> {{ realtimeReply }}</p>
					</div>
				</div>
			</div>
		</v-tabs-window-item>
	</v-tabs-window>
</template>

<style scoped>
.realtimePreview {
	width: 100%;
	max-width: 640px;
	background: #111;
}
.realtimeCanvas {
	display: none;
}
.realtimeError {
	color: #b00020;
}
.realtimeEvaluation p {
	margin: 0.25rem 0;
}
</style>
