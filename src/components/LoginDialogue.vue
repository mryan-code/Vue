<script setup>
// // imports
import { computed, nextTick, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import { useRouter } from "vue-router";
import * as types from "@/types";
import { Mail, KeySquare, Check, X, Loader } from "@lucide/vue";

// // composables and classes
const router = useRouter();
const API = new APIClass();
const appStore = useAppStore();

// // declare variables
const email = ref("");
const auth_code = ref("");
const password = ref("");
const loginMessages = ref([]);
const verify = ref(false);
const verifyMessages = ref([]);

// // declare functions
const loginRequest = async (event) => {
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

const verifyRequest = async (event) => {
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
const loginSubmit = async (event) => {
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
									id="passwordInput"
									:data-field="`password`"
									v-model="password"
									type="password"
									required
									autocomplete="off"
									autocorrect="off"
									autocapitalize="off"
									spellcheck="false"
									:error="loginMessages.length > 0"
									:error-messages="loginMessages"
									:readonly="verify"
									ref="passwordRef"
									variant="plain"
								/>
							</div>
						</Transition>
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

					<p class="dialogueProgress"><v-progress-circular indeterminate></v-progress-circular></p>
				</div>
			</div>
		</Transition>
	</v-dialog>
</template>

<style lang="scss" scoped></style>
