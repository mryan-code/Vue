<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useSpeechRecognition } from "@vueuse/core";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import moment from "moment-timezone";

type AiImageResponse = types.KeyValue & {
	image_mime?: string | number;
	image_base64?: string;
};

const API = new APIClass();
const appStore = useAppStore();
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

onMounted(async () => {});

onBeforeUnmount(() => {});
</script>

<template>
	<textarea
		v-model="aiPrompt"
		id="promptInput"
		@keydown="async (event) => await aiKeydown(event)"
		placeholder="Enter a prompt to generate an image..."
	></textarea>
	<div class="submitWrapper">
		<button class="button primary" @click="async (event) => aiRequest()" :disabled="!aiPrompt">Generate</button>
		<Transition name="fade">
			<div class="avatarLoader" v-if="aiIsLoading">
				<Loader class="spin" />
			</div>
		</Transition>
	</div>
	<div class="imageContainer">
		<img v-for="image in aiImageResponse" :src="`data:${image.image_mime};base64,${image.image_base64}`" />
	</div>
</template>
