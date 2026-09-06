<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useSpeechRecognition } from "@vueuse/core";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { SquarePen, Trash, Copy, Mic, MicOff, Cog, Loader } from "@lucide/vue";
import Avatar from "@/components/Avatar.vue";
import SetupDialogue from "@/components/SetupDialogue.vue";
import RuleDialogue from "@/components/RuleDialogue.vue";
import moment from "moment-timezone";

type UserGuideline = types.KeyValue & {
	user_guideline_id?: string | number;
	guideline?: string;
};
type UserConversationContent = types.KeyValue & {
	id?: string | number;
};
type UserConversation = types.KeyValue & {
	user_conversation_subject_id?: string | number;
	subject?: string;
	UserConversationContent?: UserConversationContent[];
};

const API = new APIClass();
const appStore = useAppStore();
const userP2Keyword = ref("");
const userConversationKeyword = ref("");
const userGuidelineKeyword = ref("");
const loadMoreAmount = ref(20);
const conversationPanel = ref("conversation");
// Keep a non-null rule object so dialog bindings never dereference null during close/save transitions.

// Keep API response rows narrowly typed so template keys and action handlers stay type-safe.
const getResponseRows = <T extends types.KeyValue>(response: types.KeyValue): T[] => {
	return response.success === true && Array.isArray(response.results) ? (response.results as T[]) : [];
};
const getOptionalString = (value: types.KeyValue[keyof types.KeyValue]): string | undefined => {
	return typeof value === "string" ? value : undefined;
};
const isTrainer = computed(() => {
	const role = appStore.settings.role;
	return (
		typeof role === "object" &&
		role !== null &&
		!Array.isArray(role) &&
		"name" in role &&
		(role.name === "Administrator" || role.name === "Trainer")
	);
});
const userGuideline = ref<UserGuideline[]>([]);
const userConversation = ref<UserConversation[]>([]);
const userRulesTab = ref("guidelines");
const trainTab = ref("system");
const activePanel = ref("training");
const promptListen = ref(false);
const ruleListen = ref(false);
const power = ref(false);
const tts = ref(true);
const speech = useSpeechRecognition({
	lang: "en-US",
	continuous: true,
	interimResults: true,
});

const { isListening, result, start, stop } = speech;

const chatKeydown = async (event: KeyboardEvent) => {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		appStore.avatarIsLoading = true;
		await chatRequest().finally(() => {
			appStore.avatarIsLoading = false;
		});
	}
};
const chatSubmit = async () => {
	appStore.avatarIsLoading = true;
	await chatRequest().finally(() => {
		appStore.avatarIsLoading = false;
	});
};
const chatRequest = async () => {
	try {
		let llmResponse = await API.chat(appStore.prompt, power.value, tts.value);
		if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "mryan") {
			console.log("chat response", JSON.parse(JSON.stringify(llmResponse)));
		}
		if (
			llmResponse.success == true &&
			llmResponse.results &&
			Array.isArray(llmResponse.results) &&
			llmResponse.results.length > 0
		) {
			if (llmResponse.results[0].response || llmResponse.results[0].media || llmResponse.results[0].prompt_id) {
				if (llmResponse.results[0].tts?.base64) {
					appStore.avatarTTS = JSON.parse(JSON.stringify(llmResponse.results[0].tts));
				} else {
					appStore.avatarTTS = null;
				}
				appStore.avatarResponse = llmResponse.results[0].response || "";
				appStore.prompt = "";
				appStore.avatarIsLoading = false;
				await getUserConversation();
				await getUserGuideline();
				if (llmResponse.results[0].prompt_id) {
					await appStore
						.getThread(llmResponse.results[0].prompt_id, null, true)
						.then(async (thread) => {
							appStore.thread.push(...(thread || []));
						})
						.then(async () => {
							await appStore.scrollThread();
						});
				}
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

const getUserGuideline = async () => {
	userGuideline.value = [];
	let response = await API.getUserGuideline(
		userGuidelineKeyword.value,
		false,
		getOptionalString(appStore.settings.user_id),
	);
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("getUserGuideline response", response);
	}
	userGuideline.value = getResponseRows<UserGuideline>(response);
};
const deleteUserGuideline = async (userGuideline: types.KeyValue) => {
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("deleteUserGuideline userGuideline", userGuideline);
	}
	const response = await API.deleteUserGuideline(userGuideline);
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("deleteUserGuideline response", response);
	}
	if (response.success === true) {
		await getUserGuideline();
	} else {
		console.error("Failed to delete userGuideline:", response);
	}
};
const getUserConversation = async () => {
	userConversation.value = [];
	let response = await API.getUserConversation(
		userConversationKeyword.value,
		false,
		getOptionalString(appStore.settings.user_id),
	);
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("getUserConversation response", response);
	}
	userConversation.value = getResponseRows<UserConversation>(response);
};
const deleteUserConversationSubject = async (userConversationSubject: types.KeyValue) => {
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("deleteUserConversationSubject userConversationSubject", userConversationSubject);
	}
	const response = await API.deleteUserConversationSubject(userConversationSubject);
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("deleteUserConversationSubject response", response);
	}
	if (response.success === true) {
		await getUserConversation();
	} else {
		console.error("Failed to delete userConversationSubject:", response);
	}
};
const deleteUserConversationContent = async (userConversationContent: types.KeyValue) => {
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("deleteUserConversationContent userConversationContent", userConversationContent);
	}
	const response = await API.deleteUserConversationContent(userConversationContent);
	if (appStore.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars.DEBUG_USER == "foobar") {
		console.log("deleteUserConversationContent response", response);
	}
	if (response.success === true) {
		await getUserConversation();
	} else {
		console.error("Failed to delete userConversationContent:", response);
	}
};
const togglePromptListen = async () => {
	promptListen.value = !promptListen.value;
	ruleListen.value = false;
	if (promptListen.value) {
		await start();
	} else {
		await stop();
	}
};
const loadMoreThread = async () => {
	await appStore
		.getThread(null, loadMoreAmount.value, true)
		.then(async (thread) => {
			appStore.thread = [...(thread || []), ...appStore.thread];
			if (appStore.totalAvailableThread > appStore.thread.length) {
				appStore.showLoadMore = true;
			} else {
				appStore.showLoadMore = false;
			}
		})
		.then(async () => {
			await appStore.scrollThread(true);
		});
};

const toggleRuleListen = async () => {
	ruleListen.value = !ruleListen.value;
	promptListen.value = false;
	// if (ruleListen.value) {
	// 	await startListening();
	// } else {
	// 	await stopListening();
	// }
};
const loadUserRulesTab = async () => {
	switch (userRulesTab.value) {
		case "conversations":
			await getUserConversation();
			break;
		case "guidelines":
			await getUserGuideline();
			break;
	}
};

onMounted(async () => {});

onBeforeUnmount(() => {});

watch(result, (newVal) => {
	const lastWord = appStore.prompt.split(" ").pop()?.trim();
	if (lastWord !== newVal.trim()) {
		appStore.prompt += newVal;
	}
});
watch(trainTab, async (newVal) => {
	if (newVal === "system") {
		await appStore.getRules();
	} else if (newVal === "user") {
		await loadUserRulesTab();
	}
});
watch(userRulesTab, async (newVal) => {
	await loadUserRulesTab();
});
</script>

<template>
	<div id="avatarControls">
		<v-expansion-panels v-model="activePanel" v-if="isTrainer" id="trainingControls">
			<v-expansion-panel value="training">
				<template #title>
					<span>Training Controls</span>
				</template>
				<template #text>
					<v-tabs v-model="trainTab" density="compact" variant="plain">
						<v-tab density="compact" variant="plain" value="system">System</v-tab>
						<v-tab density="compact" variant="plain" value="user">User</v-tab>
					</v-tabs>
					<v-tabs-window v-model="trainTab">
						<v-tabs-window-item value="system">
							<p>
								There are two types of global rules: hard rules, and guidelines. The hard rules are
								strict and must be followed, while guidelines are more flexible and can be overridden by
								user guidelines. Use of the AI will determine which rules are applicable based on the
								context of the conversation and the user's preferences.
							</p>
							<button
								class="button primary compact"
								@click="async () => await appStore.toggleRuleDialog(true)"
							>
								Create System Rule
							</button>
							<div class="styledFilters">
								<div class="styledFilter">
									<span class="label">Search</span>
									<input
										type="text"
										v-model="appStore.ruleKeyword as string"
										@keyup="async () => await appStore.getRules()"
									/>
								</div>
							</div>
							<div class="styledTable">
								<table>
									<thead>
										<tr>
											<th>Summary</th>
											<th>Type</th>
											<th>Deleted</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody v-if="appStore.rules.length > 0">
										<tr
											v-for="rule in appStore.rules"
											:key="rule.id as string | number | undefined"
											class="highlight"
										>
											<td>
												<v-tooltip location="bottom">
													<template v-slot:activator="{ props }">
														<span v-bind="props">{{ rule.summary }}</span>
													</template>
													<p>{{ rule.rule }}</p>
												</v-tooltip>
											</td>
											<td>{{ rule.strict == 1 ? "Hard Rule" : "Guideline" }}</td>
											<td>{{ rule.deleted == 1 ? "Yes" : "No" }}</td>
											<td class="actions">
												<button
													class="edit"
													@click="async () => await appStore.toggleRuleDialog(true, rule)"
												>
													<SquarePen />
												</button>
												<button
													class="delete"
													@click="async () => await appStore.deleteRule(rule)"
												>
													<Trash />
												</button>
												<button class="copy" @click="async () => await appStore.copyRule(rule)">
													<Copy />
												</button>
											</td>
										</tr>
									</tbody>
									<tbody v-else>
										<tr>
											<td colspan="4">No results found.</td>
										</tr>
									</tbody>
								</table>
							</div>
						</v-tabs-window-item>
						<v-tabs-window-item value="user">
							<p>
								User rules are divided into four categories: P2, Conversations, Guidelines, and Avatar.
								P2 are pieces of information about the user, Conversations are interactions, Guidelines
								can override System Guidelines, and the Avatar rules are like P2 for the Avatar. User
								rules will automatically be created based on the user's interactions with the AI.
							</p>
							<v-tabs v-model="userRulesTab" density="compact" variant="plain">
								<v-tab density="compact" variant="plain" value="conversations">Conversations</v-tab>
								<v-tab density="compact" variant="plain" value="guidelines">Guidelines</v-tab>
							</v-tabs>
							<v-tabs-window v-model="userRulesTab">
								<v-tabs-window-item value="conversations">
									<p>
										Conversations rules are interactions with the user. EG: messages, responses,
										feedback.
									</p>
									<div class="styledFilters">
										<div class="styledFilter">
											<span class="label">Search</span>
											<input
												type="text"
												v-model="userConversationKeyword"
												@keyup="async () => await getUserConversation()"
											/>
										</div>
									</div>
									<div class="styledTable">
										<table>
											<thead>
												<tr>
													<th>Subject</th>
													<th>Conversations</th>
													<th>Actions</th>
												</tr>
											</thead>
											<tbody v-if="userConversation.length > 0">
												<tr
													v-for="data in userConversation"
													:key="data.user_conversation_subject_id"
													class="highlight"
												>
													<!-- {{
														console.log(
															"data.UserConversationContent",
															JSON.parse(JSON.stringify(data)),
														)
													}} -->
													<td>{{ data.subject }}</td>
													<td>
														<ol>
															<li
																v-for="conversation in data.UserConversationContent"
																:key="conversation.id"
															>
																<pre>{{ JSON.stringify(conversation, null, 2) }}</pre>
															</li>
														</ol>
													</td>
													<td class="actions">
														<button
															class="delete"
															@click="
																async () => await deleteUserConversationSubject(data)
															"
														>
															<Trash />
														</button>
													</td>
												</tr>
											</tbody>
											<tbody v-else>
												<tr>
													<td colspan="3">No results found.</td>
												</tr>
											</tbody>
										</table>
									</div>
								</v-tabs-window-item>
								<v-tabs-window-item value="guidelines">
									<p>
										Guidelines are rules that can override system rules. EG: user preferences,
										custom settings.
									</p>
									<div class="styledFilters">
										<div class="styledFilter">
											<span class="label">Search</span>
											<input
												type="text"
												v-model="userGuidelineKeyword"
												@keyup="async () => await getUserGuideline()"
											/>
										</div>
									</div>
									<div class="styledTable">
										<table>
											<thead>
												<tr>
													<th>Guideline</th>
													<th>Actions</th>
												</tr>
											</thead>
											<tbody v-if="userGuideline.length > 0">
												<tr
													v-for="data in userGuideline"
													:key="data.user_guideline_id"
													class="highlight"
												>
													<!-- {{
														console.log(
															"data.UserGuidelineContent",
															JSON.parse(JSON.stringify(data)),
														)
													}} -->
													<td>{{ data.guideline }}</td>
													<td class="actions">
														<!-- <button
															class="delete"
															@click="async () => await deleteUserGuideline(data)"
														>
															<Trash />
														</button> -->
													</td>
												</tr>
											</tbody>
											<tbody v-else>
												<tr>
													<td colspan="2">No results found.</td>
												</tr>
											</tbody>
										</table>
									</div>
								</v-tabs-window-item>
							</v-tabs-window>
						</v-tabs-window-item>
					</v-tabs-window>
				</template>
			</v-expansion-panel>
		</v-expansion-panels>
		<v-expansion-panels id="conversationPanel" v-model="conversationPanel" v-if="appStore.thread.length > 0">
			<v-expansion-panel value="conversation">
				<template #title>
					<span>Conversation History</span>
				</template>
				<template #text>
					<div class="threadWrapper">
						<div class="thread">
							<Transition name="fade">
								<button
									v-if="appStore.showLoadMore"
									class="button primary loadMoreButton"
									@click="async () => await loadMoreThread()"
								>
									Load More
								</button>
							</Transition>
							<TransitionGroup name="thread">
								<div
									class="threadItem"
									v-for="thread in appStore.thread"
									:key="thread.prompt_id as string | number | undefined"
								>
									<div class="threadItemContentWrapper">
										<div class="threadItemPrompt">
											<span class="threadItemText">{{ thread.prompt }}</span>
										</div>
										<div class="threadItemResponse">
											<span class="threadItemText" v-if="thread.response">{{
												thread.response
											}}</span>
											<span class="threadItemText" v-if="thread.file" v-html="thread.file"></span>
										</div>
									</div>
									<!-- <div class="threadItemTimeStamp">
							<div class="threadItemDate" v-if="thread.date">{{ thread.date }}</div>
							<div class="threadItemTime" v-if="thread.time">{{ thread.time }}</div>
						</div> -->
								</div>
							</TransitionGroup>
						</div>
					</div>
				</template>
			</v-expansion-panel>
		</v-expansion-panels>
	</div>
	<div class="styledInlineForm">
		<div class="formGroup">
			<button
				class="button primary icon"
				@click="
					async (event) => {
						await togglePromptListen();
					}
				"
			>
				<Mic v-if="promptListen" />
				<MicOff v-else />
			</button>
		</div>
		<div class="formGroup">
			<span class="label">Power</span>
			<div class="radioGroup">
				<div class="radio">
					<label for="powerYes" class="label">Yes</label>
					<input id="powerYes" type="radio" :value="1" v-model="power" :checked="power === true" disabled />
				</div>
				<div class="radio">
					<label for="powerNo" class="label">No</label>
					<input id="powerNo" type="radio" :value="0" v-model="power" :checked="power === false" disabled />
				</div>
			</div>
		</div>
		<div class="formGroup">
			<span class="label">TTS</span>
			<div class="radioGroup">
				<div class="radio">
					<label for="ttsYes" class="label">Yes</label>
					<input id="ttsYes" type="radio" :value="1" v-model="tts" :checked="tts === true" />
				</div>
				<div class="radio">
					<label for="ttsNo" class="label">No</label>
					<input id="ttsNo" type="radio" :value="0" v-model="tts" :checked="tts === false" />
				</div>
			</div>
		</div>
		<div class="formGroup">
			<button class="button primary icon" @click="async () => await appStore.toggleSetupDialogue(true)">
				<Cog />
			</button>
		</div>
	</div>
	<textarea
		v-model="appStore.prompt"
		id="promptInput"
		@keydown="async (event) => await chatKeydown(event)"
		placeholder="Prompt..."
	></textarea>
	<div class="submitWrapper">
		<button class="button primary" @click="async (event) => chatSubmit()" :disabled="!appStore.prompt">
			Query
		</button>
		<Transition name="fade">
			<div class="avatarLoader" v-if="appStore.avatarIsLoading">
				<Loader class="spin" />
			</div>
		</Transition>
	</div>
	<Avatar />
	<RuleDialogue />
	<SetupDialogue />
</template>
