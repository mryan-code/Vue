<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useSpeechRecognition, useSpeechSynthesis } from "@vueuse/core";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { Loader, Play, Pause } from "@lucide/vue";

const API = new APIClass();
const appStore = useAppStore();
const { avatarResponse, avatarTTS } = storeToRefs(appStore);
const audioUrl = ref<string | null>(null);
const audioPlayer = ref<HTMLAudioElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
let animationFrame = 0;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let mediaStreamSource: MediaStreamAudioSourceNode | null = null;
let mediaElementSource: MediaElementAudioSourceNode | null = null;
let frequencyData: Uint8Array | null = null;
let resizeObserver: ResizeObserver | null = null;
let lastFrame = 0;
let manualAudioLevel: number | null = null;
let manualAudioLevelUpdated = 0;
let speechAudioPulseFrame = 0;
type AvatarAudioLevelEvent = CustomEvent<{ level: number }>;

const speech = useSpeechRecognition({
	lang: "en-US",
	continuous: true,
	interimResults: true,
});

const { isListening, result, start, stop } = speech;

const createShader = (gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null => {
	const shader = gl.createShader(type);
	if (shader === null) {
		return null;
	}
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		gl.deleteShader(shader);
		return null;
	}
	return shader;
};

const createProgram = (gl: WebGLRenderingContext): WebGLProgram | null => {
	const vertexShader = createShader(
		gl,
		gl.VERTEX_SHADER,
		`
			attribute vec2 position;
			void main() {
				gl_Position = vec4(position, 0.0, 1.0);
			}
		`,
	);
	const fragmentShader = createShader(
		gl,
		gl.FRAGMENT_SHADER,
		`
			precision mediump float;
			uniform vec2 resolution;
			uniform float time;
			uniform float audio;
			uniform vec3 primaryColor;

			float ring(vec2 uv, float radius, float thickness) {
				return smoothstep(thickness, 0.0, abs(length(uv) - radius));
			}

			float spokes(vec2 uv, float count, float speed) {
				float angle = atan(uv.y, uv.x) + time * speed;
				return smoothstep(0.965, 1.0, abs(sin(angle * count)));
			}

			float grid(vec2 uv) {
				vec2 g = abs(fract((uv + time * 0.02) * 9.0) - 0.5);
				return smoothstep(0.492, 0.5, max(g.x, g.y));
			}

			void main() {
				vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
				float pulse = 0.08 + audio * 0.2;
				float core = ring(uv, 0.22 + pulse, 0.03 + audio * 0.02);
				float inner = ring(uv, 0.42 + sin(time * 1.7) * 0.025, 0.013);
				float outer = ring(uv, 0.72 + audio * 0.08, 0.018);
				float halo = smoothstep(0.95 + audio * 0.15, 0.18, length(uv));
				float radial = spokes(uv, 18.0, 0.38) * outer;
				float fine = spokes(uv, 54.0, -0.22) * ring(uv, 0.58, 0.02);
				float circuit = grid(uv) * smoothstep(0.9, 0.18, length(uv)) * 0.18;
				float sparks = smoothstep(0.986, 1.0, sin((uv.x * 37.0 + uv.y * 61.0) + time * 8.0));
				float glow = core * 1.5 + inner + outer * 1.4 + radial + fine * 0.7 + circuit + sparks * audio;
				vec3 base = clamp(primaryColor, 0.0, 1.0);
				vec3 darkTone = base * (0.18 + audio * 0.08);
				vec3 brightTone = min(base * (1.35 + audio * 0.35), vec3(1.0));
				vec3 coreTone = min(base * 1.6, vec3(1.0));
				vec3 color = darkTone * halo + brightTone * glow + coreTone * core;
				float alpha = smoothstep(1.05, 0.2, length(uv));
				gl_FragColor = vec4(color, alpha);
			}
		`,
	);

	if (vertexShader === null || fragmentShader === null) {
		return null;
	}

	const program = gl.createProgram();
	if (program === null) {
		return null;
	}

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		return null;
	}

	return program;
};

const updateAudioLevel = () => {
	if (manualAudioLevel !== null && performance.now() - manualAudioLevelUpdated < 500) {
		appStore.avatarAudioLevel = appStore.avatarAudioLevel * 0.78 + manualAudioLevel * 0.22;
		return;
	}

	if (analyser === null || frequencyData === null) {
		const fallback = 0.12 + Math.sin(performance.now() / 520) * 0.04;
		appStore.avatarAudioLevel = appStore.avatarAudioLevel * 0.94 + fallback * 0.06;
		return;
	}

	analyser.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>);
	const sum = frequencyData.reduce((total, value) => total + value, 0);
	const nextLevel = Math.min(sum / frequencyData.length / 155, 1);
	appStore.avatarAudioLevel = appStore.avatarAudioLevel * 0.82 + nextLevel * 0.18;
};

const connectAnalyser = () => {
	if (audioContext === null) {
		audioContext = new AudioContext();
	}

	analyser?.disconnect();
	analyser = audioContext.createAnalyser();
	analyser.fftSize = 512;
	analyser.smoothingTimeConstant = 0.84;
	frequencyData = new Uint8Array(analyser.frequencyBinCount);

	return analyser;
};

const attachAudioStream = (stream: MediaStream) => {
	const nextAnalyser = connectAnalyser();
	if (audioContext === null) {
		return;
	}

	mediaStreamSource?.disconnect();
	mediaStreamSource = audioContext.createMediaStreamSource(stream);
	mediaStreamSource.connect(nextAnalyser);
};

const attachAudioElement = (element: HTMLAudioElement) => {
	const nextAnalyser = connectAnalyser();
	if (audioContext === null) {
		return;
	}

	try {
		mediaElementSource?.disconnect();
		mediaElementSource = audioContext.createMediaElementSource(element);
		mediaElementSource.connect(nextAnalyser);
		nextAnalyser.connect(audioContext.destination);
	} catch (error) {
		console.warn("Avatar audio element could not be connected", error);
	}
};

const setAudioLevel = (level: number) => {
	manualAudioLevel = Math.max(0, Math.min(level, 1));
	manualAudioLevelUpdated = performance.now();
};

const emitAvatarAudioLevel = (level: number) => {
	// Emit synthetic levels so the existing avatar event handler reacts to TTS playback.
	window.dispatchEvent(
		new CustomEvent("avatar-audio-level", {
			detail: {
				level: Math.max(0, Math.min(level, 1)),
			},
		}),
	);
};

const stopSpeechAudioPulse = () => {
	if (speechAudioPulseFrame !== 0) {
		window.cancelAnimationFrame(speechAudioPulseFrame);
		speechAudioPulseFrame = 0;
	}
};

const startSpeechAudioPulse = () => {
	stopSpeechAudioPulse();

	const pulse = (now: number) => {
		// Keep small natural variation while TTS is speaking.
		const level = 0.38 + Math.sin(now / 95) * 0.12 + Math.sin(now / 41) * 0.06;
		emitAvatarAudioLevel(level);

		if (isPlaying.value === true) {
			speechAudioPulseFrame = window.requestAnimationFrame(pulse);
		}
	};

	speechAudioPulseFrame = window.requestAnimationFrame(pulse);
};

const onAvatarAudioLevel = (event: Event) => {
	const audioEvent = event as AvatarAudioLevelEvent;
	if (typeof audioEvent.detail?.level !== "number") {
		return;
	}

	setAudioLevel(audioEvent.detail.level);
};

const resizeCanvas = () => {
	const targetCanvas = canvas.value;
	if (targetCanvas === null) {
		return;
	}
	const maxHeight = 300;
	const pixelRatio = window.devicePixelRatio || 1;
	const width = Math.max(Math.floor(targetCanvas.clientWidth * pixelRatio), 1);
	const height = Math.max(Math.floor(targetCanvas.clientHeight * pixelRatio), 1);

	if (targetCanvas.width !== width || targetCanvas.height !== height) {
		targetCanvas.width = width;
		targetCanvas.height = height;
	}
};

// Convert CSS --primary into normalized RGB so the avatar shader follows theme colors.
const getPrimaryColor = () => {
	const fallback: [number, number, number] = [0.84, 0.12, 0.1];
	const style = getComputedStyle(document.documentElement);
	const rawValue = style.getPropertyValue("--primary").trim();

	if (rawValue.length === 0) {
		return fallback;
	}

	const hexMatch = rawValue.match(/^#([\da-fA-F]{3}|[\da-fA-F]{6})$/);
	if (hexMatch) {
		const compact = hexMatch[1];
		const normalizedHex =
			compact.length === 3
				? compact
						.split("")
						.map((value) => `${value}${value}`)
						.join("")
				: compact;
		const red = Number.parseInt(normalizedHex.slice(0, 2), 16) / 255;
		const green = Number.parseInt(normalizedHex.slice(2, 4), 16) / 255;
		const blue = Number.parseInt(normalizedHex.slice(4, 6), 16) / 255;
		return [red, green, blue];
	}

	const rgbMatch = rawValue.match(/^rgba?\(([^)]+)\)$/i);
	if (rgbMatch) {
		const parts = rgbMatch[1].split(",").map((part) => Number.parseFloat(part.trim()));
		if (parts.length >= 3 && parts.slice(0, 3).every((value) => Number.isFinite(value))) {
			return [
				Math.max(0, Math.min(parts[0], 255)) / 255,
				Math.max(0, Math.min(parts[1], 255)) / 255,
				Math.max(0, Math.min(parts[2], 255)) / 255,
			];
		}
	}

	return fallback;
};

const startAnimation = () => {
	const targetCanvas = canvas.value;
	if (targetCanvas === null) {
		return;
	}

	const gl = targetCanvas.getContext("webgl", { alpha: true, antialias: true });
	if (gl === null) {
		return;
	}

	const program = createProgram(gl);
	if (program === null) {
		return;
	}

	const buffer = gl.createBuffer();
	const position = gl.getAttribLocation(program, "position");
	const resolution = gl.getUniformLocation(program, "resolution");
	const time = gl.getUniformLocation(program, "time");
	const audio = gl.getUniformLocation(program, "audio");
	const primaryColor = gl.getUniformLocation(program, "primaryColor");

	if (
		buffer === null ||
		position === -1 ||
		resolution === null ||
		time === null ||
		audio === null ||
		primaryColor === null
	) {
		return;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
	gl.useProgram(program);
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	const render = (now: number) => {
		lastFrame = lastFrame || now;
		const elapsed = (now - lastFrame) / 1000;
		lastFrame = now;

		updateAudioLevel();
		resizeCanvas();
		gl.viewport(0, 0, targetCanvas.width, targetCanvas.height);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform2f(resolution, targetCanvas.width, targetCanvas.height);
		gl.uniform1f(time, now / 1000);
		gl.uniform1f(audio, Math.min(appStore.avatarAudioLevel + elapsed * 0.1, 1));
		const [primaryRed, primaryGreen, primaryBlue] = getPrimaryColor();
		gl.uniform3f(primaryColor, primaryRed, primaryGreen, primaryBlue);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		animationFrame = window.requestAnimationFrame(render);
	};

	render(0);
};

const loadAudioBlob = async (blob: Blob) => {
	// Clean up previous URL if it exists to avoid memory leaks
	cleanUpUrl();

	// Create a streamable local URL from the Blob object
	audioUrl.value = URL.createObjectURL(blob);
};

// 2. Programmatic control methods
const playAudio = () => {
	if (audioPlayer.value) {
		audioPlayer.value.play().catch((error) => {
			console.error("Playback failed. Ensure user interacted with the page first:", error);
		});
	}
};

const stopAudio = () => {
	if (audioPlayer.value) {
		audioPlayer.value.pause();
		audioPlayer.value.currentTime = 0;
	}
};

// Memory cleanup utility
const cleanUpUrl = () => {
	if (audioUrl.value) {
		URL.revokeObjectURL(audioUrl.value);
		audioUrl.value = "";
	}
};

defineExpose({
	attachAudioElement,
	attachAudioStream,
	setAudioLevel,
});

onMounted(async () => {
	// start();
	resizeCanvas();
	startAnimation();
	window.addEventListener("avatar-audio-level", onAvatarAudioLevel);

	if (canvas.value !== null) {
		resizeObserver = new ResizeObserver(resizeCanvas);
		resizeObserver.observe(canvas.value);
	}
});

const {
	speak,
	stop: stopSpeechSynthesis,
	isPlaying,
	status,
} = useSpeechSynthesis(avatarResponse, {
	lang: "en-US",
	pitch: 1,
	rate: 1,
});

onBeforeUnmount(() => {
	stopSpeechSynthesis();
	stopSpeechAudioPulse();
	window.cancelAnimationFrame(animationFrame);
	window.removeEventListener("avatar-audio-level", onAvatarAudioLevel);
	cleanUpUrl();
	resizeObserver?.disconnect();
	mediaStreamSource?.disconnect();
	mediaElementSource?.disconnect();
	analyser?.disconnect();
	audioContext?.close();
});

// watch(result, (newVal) => {
// 	const lastWord = prompt.value.split(" ").pop()?.trim();
// 	if (lastWord !== newVal.trim()) {
// 		prompt.value += newVal;
// 	}
// });

watch(avatarResponse, async (nextResponse) => {
	// Restart speech so each updated response is spoken from the beginning.
	stopSpeechSynthesis();
	stopSpeechAudioPulse();
	if (appStore.avatarTTS?.base64) {
		const audioBlob = await fetch(
			`data:${appStore.avatarTTS.mime_type || "audio/wav"};base64,${appStore.avatarTTS.base64}`,
		).then((res) => res.blob());
		await loadAudioBlob(audioBlob).then(() => {
			playAudio();
			emitAvatarAudioLevel(0.56);
		});
	}
});

watch(isPlaying, (nextPlaying) => {
	if (nextPlaying === true) {
		startSpeechAudioPulse();
		return;
	}

	stopSpeechAudioPulse();
});
</script>

<template>
	<div v-if="appStore.avatarTTS?.base64 && audioUrl">
		<!-- <button class="button icon success" @click="playAudio"><Play /></button> -->
		<div class="audioPlayerWrapper">
			<audio
				ref="audioPlayer"
				:src="audioUrl"
				@play="startSpeechAudioPulse"
				@pause="stopSpeechAudioPulse"
				@ended="stopSpeechAudioPulse"
				controls
			></audio>
		</div>
	</div>
	<div id="avatarWrapper">
		<div class="avatarVisual" aria-label="Audio reactive avatar">
			<canvas ref="canvas" class="avatarVisualCanvas"></canvas>
		</div>
	</div>
</template>
