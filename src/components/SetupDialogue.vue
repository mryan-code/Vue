<script setup lang="ts">
// // imports
import { onMounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import * as types from "@/types";
import { Mars, Venus, X } from "@lucide/vue";

// // composables and classes
const API = new APIClass();
const appStore = useAppStore();

// // data

// // functions
</script>

<template>
	<v-dialog
		v-model="appStore.setupDialogue"
		v-on:update:model-value="async () => await appStore.toggleSetupDialogue()"
		max-width="fit-content"
		class="setupDialogueWrapper dialogueWrapper"
		:attach="'#main'"
	>
		<Transition name="fade">
			<div class="setupDialogue dialogue">
				<div class="dialogueHeader">
					<div class="dialogueTitle">
						<h3>Setup</h3>
					</div>
					<div class="dialogueClose">
						<a href="javascript:void(0)" @click="async () => await appStore.toggleSetupDialogue()">
							<X />
						</a>
					</div>
				</div>
				<div class="dialogueContent">
					<div class="styledForm">
						<div class="formRow">
							<span class="label">User's Name</span>
							<input
								type="text"
								v-model="appStore.avatarSettings.user_name as string"
								@keyup="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
							/>
						</div>
						<div class="formRow">
							<span class="label">Avatar Name</span>
							<input
								type="text"
								v-model="appStore.avatarSettings.avatar_name as string"
								@keyup="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
							/>
						</div>
						<div class="formRow">
							<span class="label">Voice</span>
							<select
								v-model="appStore.avatarSettings.avatar_voice as string"
								@change="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
							>
								<option
									v-for="voice in appStore.avatarVoices"
									:key="voice.voice_id as string"
									:value="voice.option as string"
									:selected="voice.option === appStore.avatarSettings.avatar_voice"
								>
									{{ voice.label as string }}
								</option>
							</select>
						</div>
						<div class="formRow">
							<span class="label">Personality</span>
							<div
								class="sliderRow"
								v-for="personality in appStore.avatarPersonalities"
								:key="personality.key as string"
							>
								<span class="label">{{ personality.startLabel }}</span>
								<div class="slider-container">
									<input
										type="range"
										v-model="appStore.avatarSettings[personality.key as string]"
										:min="10"
										:max="100"
										:step="1"
										class="custom-slider"
										@change="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
									/>
								</div>
								<span class="label">{{ personality.endLabel }}</span>
							</div>
						</div>
						<div class="formRow">
							<span class="label">NSFW</span>
							<div class="radioGroup">
								<div class="radio">
									<label for="nsfwYes" class="label">Keep it clean</label>
									<input
										id="nsfwYes"
										type="radio"
										:value="1"
										v-model="appStore.avatarSettings.avatar_nsfw"
										:checked="appStore.avatarSettings.avatar_nsfw === 1"
										@change="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
									/>
								</div>
								<div class="radio">
									<label for="nsfwNo" class="label">No fucking filters</label>
									<input
										id="nsfwNo"
										type="radio"
										:value="0"
										v-model="appStore.avatarSettings.avatar_nsfw"
										:checked="appStore.avatarSettings.avatar_nsfw === 0"
										@change="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
									/>
								</div>
							</div>
						</div>
						<div class="formRow">
							<span class="label">User's Pronouns</span>
							<div class="radioGroup">
								<div class="radio">
									<label for="heHim" class="label">He/Him</label>
									<input
										id="heHim"
										type="radio"
										:value="`He/Him`"
										v-model="appStore.avatarSettings.user_pronouns as string"
										:checked="appStore.avatarSettings.user_pronouns === `He/Him`"
										@change="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
									/>
								</div>
								<div class="radio">
									<label for="sheHer" class="label">She/Her</label>
									<input
										id="sheHer"
										type="radio"
										:value="`She/Her`"
										v-model="appStore.avatarSettings.user_pronouns as string"
										:checked="appStore.avatarSettings.user_pronouns === `She/Her`"
										@change="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
									/>
								</div>
								<div class="radio">
									<label for="theyThem" class="label">They/Them</label>
									<input
										id="theyThem"
										type="radio"
										:value="`They/Them`"
										v-model="appStore.avatarSettings.user_pronouns as string"
										:checked="appStore.avatarSettings.user_pronouns === `They/Them`"
										@change="async () => await appStore.saveUserAvatar(appStore.avatarSettings)"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</v-dialog>
</template>

<style lang="scss" scoped></style>
