<script lang="ts" setup>
// // imports
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import * as functions from "@/functions";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import { pages } from "@/router/pages";
import { useRoute, useRouter } from "vue-router";
import * as types from "@/types";
import { Mail, KeySquare, Check, X, Loader } from "@lucide/vue";
import { useVisitorData } from "@fingerprint/vue";

const { data, error, isLoading, getData } = useVisitorData({
	immediate: false,
});
const route = useRoute();
const router = useRouter();

// // composables and classes
const API = new APIClass();
const appStore = useAppStore();

// // declare variables
const email = ref("");
const auth_code = ref("");
const loginMessages = ref<string[]>([]);
const verify = ref(false);
const verifyMessages = ref<string[]>([]);

// // functions
const loginRequest = async (event: Event) => {
	event.preventDefault();
	// const buttonElement = event?.currentTarget as HTMLElement;
	// await appStore.buttonFeedback(buttonElement, true, false, false);
	const visitorData = await getData();
	console.log("visitorData", visitorData);

	const loginRequest = await API.login(email.value);
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
	let visitorData = null;
	try {
		visitorData = await getData();
		console.log("visitorData", JSON.parse(JSON.stringify(visitorData)));
	} catch (error: any) {
		console.log("error", error.message);
	}
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
		visitorData?.visitor_id as string | null,
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

// watch(route, async () => {
// 	console.log("router", JSON.parse(JSON.stringify(route)));
// });

// on mounted
onMounted(async () => {
	const domain = window.location.hostname;
	appStore.authenticated = false;
	if (localStorage.getItem(appStore.loginTokenKey)) {
		localStorage.removeItem(appStore.loginTokenKey);
	}

	verify.value = false;
	loginMessages.value = [];
	verifyMessages.value = [];
	await appStore.focusField("#emailInput");
});

// // on unmounted
// onUnmounted(async () => {
// 	// console.clear();
// });
</script>

<template>
	<v-card class="login-card">
		<v-card-item>
			<v-card-title>
				<h2>Login</h2>
			</v-card-title>

			<v-card-text>
				<p>Please enter your email and login code to continue.</p>
			</v-card-text>

			<v-card-text v-if="loginMessages.length > 0 || verifyMessages.length > 0">
				<div v-if="loginMessages.length > 0">
					<p>Login Messages:</p>
					<ul>
						<li v-for="message in loginMessages" :key="message">{{ message }}</li>
					</ul>
				</div>
				<div v-if="verifyMessages.length > 0">
					<p>Verify Messages:</p>
					<ul>
						<li v-for="message in verifyMessages" :key="message">{{ message }}</li>
					</ul>
				</div>
			</v-card-text>

			<v-form id="loginForm">
				<Transition name="fade">
					<div class="inputWrapper">
						<input
							class="input"
							id="emailInput"
							:data-field="`email`"
							v-model="email"
							type="email"
							required
							@keyup.enter="async (event: Event) => await loginSubmit(event)"
							:error="loginMessages.length > 0"
							:error-messages="loginMessages"
							:readonly="verify"
							ref="emailRef"
							variant="plain"
						/>
						<button
							class="button primary"
							id="loginButton"
							@click="async (event: Event) => await loginRequest(event as Event)"
							:disabled="email.length === 0 || verify"
						>
							<span class="buttonInitial">
								<span class="buttonIcon">
									<Mail />
								</span>
							</span>
							<!-- <span class="buttonText">Get Login Code</span> -->
							<!-- <span class="buttonFeedback">
								<span class="buttonFeedbackSuccess">
									<Check />
								</span>
								<span class="buttonFeedbackError">
									<X />
								</span>
								<span class="buttonFeedbackPending">
									<Loader class="spin" />
								</span>
							</span> -->
						</button>
					</div>
				</Transition>
				<Transition name="fade">
					<div class="inputWrapper">
						<input
							class="input"
							id="verifyInput"
							:data-field="`verify`"
							v-model="auth_code"
							type="text"
							required
							autocomplete="off"
							autocorrect="off"
							autocapitalize="off"
							spellcheck="false"
							@keyup.enter="async (event: Event) => await loginSubmit(event)"
							:error="verifyMessages.length > 0"
							:error-messages="verifyMessages"
							:readonly="!verify"
							ref="verifyRef"
							:disabled="!verify"
							variant="plain"
						/>
						<button
							class="button primary"
							id="verifyButton"
							@click="async (event: Event) => await verifyRequest(event as Event)"
							:disabled="auth_code.length === 0 || !verify"
						>
							<span class="buttonInitial">
								<span class="buttonIcon">
									<KeySquare />
								</span>
							</span>
							<!-- <span class="buttonText">Login</span> -->
							<!-- <span class="buttonFeedback">
								<span class="buttonFeedbackSuccess">
									<Check />
								</span>
								<span class="buttonFeedbackError">
									<X />
								</span>
								<span class="buttonFeedbackPending">
									<Loader class="spin" />
								</span>
							</span> -->
						</button>
					</div>
				</Transition>
			</v-form>
		</v-card-item>
	</v-card>
</template>

<style lang="scss"></style>
