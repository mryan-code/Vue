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

onMounted(async () => {});
</script>

<template>
	<v-dialog
		v-model="appStore.wssDialogue"
		v-on:update:model-value="appStore.closeWSSDialogue"
		max-width="fit-content"
		class="wssDialogueWrapper dialogueWrapper"
		:attach="'#main'"
	>
		<Transition name="fade">
			<div class="wssDialogue dialogue">
				<div class="dialogueHeader">
					<div class="dialogueTitle">
						<h3>Setup</h3>
					</div>
				</div>
				<div v-if="appStore.wssConnectionAttempt > appStore.wssConnectionAttemptMax">
					<h3 class="dialogueTitle">Connection failed</h3>
					<p
						v-if="
							appStore.globalVars.NODE_ENV !== 'production' &&
							appStore.globalVars.NODE_ENV !== 'prod' &&
							appStore.wssConnectionAttempt > 0
						"
					>
						Connection failed after {{ appStore.wssConnectionAttempt }} attempts
					</p>
				</div>
				<div v-else>
					<h3 class="dialogueTitle">{{ appStore.wssDialogueMessage }}</h3>
					<p v-if="appStore.wssError != ''">{{ appStore.wssError }}</p>
					<p
						v-if="
							appStore.globalVars.NODE_ENV !== 'production' &&
							appStore.globalVars.NODE_ENV !== 'prod' &&
							appStore.wssConnectionAttempt > 0
						"
					>
						Attempt {{ appStore.wssConnectionAttempt }} out of {{ appStore.wssConnectionAttemptMax }}
					</p>
					<p class="dialogueProgress"><v-progress-circular indeterminate></v-progress-circular></p>
				</div>
			</div>
		</Transition>
	</v-dialog>
</template>

<style lang="scss" scoped></style>
