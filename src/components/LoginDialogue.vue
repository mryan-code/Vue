<script setup lang="ts">
// lang="ts" so Vite parses the type assertions in this file instead of treating them as JavaScript.
// // imports
import { computed, nextTick, onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import { useRouter } from "vue-router";
import * as types from "@/types";
import { Mail, KeySquare, Check, X, Loader } from "@lucide/vue";

// // composables and classes
const API = new APIClass();
const appStore = useAppStore();

// // declare variables
const email = ref("");
const password = ref("");
const loginMessages = ref([]);

// // declare functions
const loginSubmit = async (event) => {
	event.preventDefault();
	await loginRequest(event);
};
const loginRequest = async (event) => {
	event.preventDefault();
	const userAgent: string | string[] = navigator.userAgent;
	const IP: string | null = await API.getIP();
	const geoLocation: types.KeyValue | null = await API.getGeoLocation(IP as string);
	// const buttonElement = event?.currentTarget as HTMLElement;
	// await appStore.buttonFeedback(buttonElement, true, false, false);
	const loginRequest = (await API.login(
		email.value,
		password.value,
		userAgent as string | null,
		IP as string | null,
		geoLocation?.latitude as number | null,
		geoLocation?.longitude as number | null,
	)) as types.KeyValue;
	if (loginRequest.authenticated === true) {
		// await appStore.buttonFeedback(buttonElement, false, false, false);
		//close login dialogue
		appStore.closeLoginDialogue();
	} else {
		// await appStore.buttonFeedback(buttonElement, false, false, true);
		if (loginRequest.message && Array.isArray(loginRequest.message)) {
			loginMessages.value = loginRequest.message as string[];
		}
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

					<v-card-text v-if="loginMessages.length > 0">
						<div v-if="loginMessages.length > 0">
							<p>Login Messages:</p>
							<ul>
								<li v-for="message in loginMessages" :key="message">{{ message }}</li>
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
									ref="emailRef"
									variant="plain"
								/>
							</div>
						</Transition>

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
									ref="passwordRef"
									variant="plain"
								/>
							</div>
						</Transition>

						<Transition name="fade">
							<div class="inputWrapper">
								<button
									class="button primary"
									id="loginButton"
									@click="async (event: Event) => await loginRequest(event as Event)"
									:disabled="email.length === 0 || password.length === 0"
								>
									<span class="buttonInitial">
										<span class="buttonIcon">
											<Lock />
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
					</v-form>
				</div>
			</div>
		</Transition>
	</v-dialog>
</template>

<style lang="scss" scoped></style>
