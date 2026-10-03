<script setup>
// // imports
import { computed, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import { storeToRefs } from "pinia";
import { X, Loader } from "@lucide/vue";
import * as functions from "@/functions";

// // composables and classes
const API = new APIClass();
const appStore = useAppStore();

// // functions
const email = ref("");
	const auth_code = ref("");
	const password = ref("");
	const loginMessages = ref<string[]>([]);
	const verify = ref(false);
	const verifyMessages = ref<string[]>([]);

	// // functions
	const loginRequest = async (event: Event) => {
		event.preventDefault();
		// const buttonElement = event?.currentTarget as HTMLElement;
		// await appStore.buttonFeedback(buttonElement, true, false, false);
		// const visitorData = await getData();
		// console.log("visitorData", visitorData);

		const loginRequest = await API.login(email.value, password.value);
		if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
			console.log("login response", JSON.parse(JSON.stringify(loginRequest)));
		}
		if (loginRequest.success === true) {
			// await appStore.buttonFeedback(buttonElement, false, true, false);

			loginMessages.value = [];
			verify.value = true;
			auth_code.value = "";
			if (loginRequest.auth_code) {
				auth_code.value = loginRequest.auth_code as string;
			}
			await nextTick();
			appStore.focusField("#verifyInput");
			await appStore.delay(3000);
			// await appStore.buttonFeedback(buttonElement, false, false, false);
		} else {
			// await appStore.buttonFeedback(buttonElement, false, false, true);
			if (loginRequest.message && Array.isArray(loginRequest.message)) {
				loginMessages.value = loginRequest.message as string[];
			}
			await nextTick();
			appStore.focusField("#emailInput");
		}
	};

	const verifyRequest = async (event: Event) => {
		event.preventDefault();
		// let visitorData = null;
		// try {
		// 	visitorData = await getData();
		// 	console.log("visitorData", JSON.parse(JSON.stringify(visitorData)));
		// } catch (error: any) {
		// 	console.log("error", error.message);
		// }
		const userAgent: string | string[] = navigator.userAgent;
		const IP: string | null = await API.getIP();
		const geoLocation: types.KeyValue | null = await API.getGeoLocation(IP as string);
		// const buttonElement = event?.currentTarget as HTMLElement;
		// await appStore.buttonFeedback(buttonElement, true, false, false);
		const verifyRequest = (await API.verify(
			email.value,
			auth_code.value,
			userAgent as string | null,
			IP as string | null,
			geoLocation?.latitude as number | null,
			geoLocation?.longitude as number | null,
		)) as types.KeyValue;
		if (verifyRequest.authenticated === true) {
			// await appStore.buttonFeedback(buttonElement, false, false, false);
			auth_code.value = "";
			email.value = "";
			await router.replace({ path: "/" });
		} else {
			// await appStore.buttonFeedback(buttonElement, false, false, true);
			if (verifyRequest.message && Array.isArray(verifyRequest.message)) {
				verifyMessages.value = verifyRequest.message as string[];
			}
			await nextTick();
			appStore.focusField("#verifyInput");
		}
	};
	const loginSubmit = async (event: Event) => {
		event.preventDefault();
		let type = "login";
		if (auth_code.value.length > 0) {
			type = "verify";
		}
		if (type === "login") {
			await loginRequest(event);
		} else if (type === "verify") {
			await verifyRequest(event);
		}
	};

onMounted(async () => {});
</script>

<template>
	<v-dialog
		v-model="appStore.loginDialogue"
		v-on:update:model-value="appStore.closeLoginDialogue"
		max-width="fit-content"
		class="loginDialogueWrapper dialogueWrapper"
		:attach="'#main'"
	>
		<Transition name="fade">
			<div class="loginDialogue dialogue">
				<div class="dialogueHeader">
					<div class="dialogueTitle">
						<h3>Login</h3>
					</div>
				</div>
				<div>
					<h3 class="dialogueTitle">{{ appStore.loginDialogueMessage }}</h3>
					<p v-if="appStore.loginDialogueError != ''">{{ appStore.loginDialogueError }}</p>

					<p class="dialogueProgress"><v-progress-circular indeterminate></v-progress-circular></p>
				</div>
			</div>
		</Transition>
	</v-dialog>
</template>

<style lang="scss" scoped></style>
