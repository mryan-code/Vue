<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/store/app";
import * as types from "@/types";

const appStore = useAppStore();

// Writable computed refs avoid optional-chaining assignment in v-model bindings.
const ruleSummary = computed({
	get: (): string => (appStore.rule?.summary as string) ?? "",
	set: (value: string) => {
		if (appStore.rule) {
			appStore.rule.summary = value;
		}
	},
});
const ruleText = computed({
	get: (): string => (appStore.rule?.rule as string) ?? "",
	set: (value: string) => {
		if (appStore.rule) {
			appStore.rule.rule = value;
		}
	},
});
const ruleStrict = computed({
	get: (): number => (appStore.rule?.strict as number) ?? 1,
	set: (value: number) => {
		if (appStore.rule) {
			appStore.rule.strict = value;
		}
	},
});
const ruleDeleted = computed({
	get: (): number => (appStore.rule?.deleted as number) ?? 0,
	set: (value: number) => {
		if (appStore.rule) {
			appStore.rule.deleted = value;
		}
	},
});
</script>

<template>
	<v-dialog
		v-model="appStore.ruleDialogue"
		v-on:update:model-value="async () => await appStore.toggleRuleDialog(false)"
		max-width="fit-content"
		class="dialogueWrapper"
		:attach="'#main'"
	>
		<Transition name="fade">
			<div class="dialogue">
				<div class="dialogueHeader">
					<div class="dialogueTitle">
						<h3>{{ appStore.rule && appStore.rule.global_rule_id !== null ? "Edit" : "Add" }} Rule</h3>
					</div>
				</div>
				<div class="dialogueContent">
					<div class="styledForm">
						<div class="formRow">
							<span class="label">Summary</span>
							<input type="text" v-model="ruleSummary" />
						</div>
						<div class="formRow">
							<span class="label">Rule</span>
							<textarea v-model="ruleText"></textarea>
						</div>
						<div class="formRow">
							<span class="label">Type</span>
							<div class="radioGroup">
								<div class="radio">
									<label for="hardRule" class="label">Hard Rule</label>
									<input
										id="hardRule"
										type="radio"
										:value="1"
										v-model="ruleStrict"
										:checked="ruleStrict === 1"
									/>
								</div>
								<div class="radio">
									<label for="guideline" class="label">Guideline</label>
									<input
										id="guideline"
										type="radio"
										:value="0"
										v-model="ruleStrict"
										:checked="ruleStrict === 0"
									/>
								</div>
							</div>
						</div>
						<div class="formRow">
							<span class="label">Deleted</span>
							<div class="radioGroup">
								<div class="radio">
									<label for="deletedYes" class="label">Yes</label>
									<input
										id="deletedYes"
										type="radio"
										:value="1"
										v-model="ruleDeleted"
										:checked="ruleDeleted === 1"
									/>
								</div>
								<div class="radio">
									<label for="deletedNo" class="label">No</label>
									<input
										id="deletedNo"
										type="radio"
										:value="0"
										v-model="ruleDeleted"
										:checked="ruleDeleted === 0"
									/>
								</div>
							</div>
						</div>

						<div class="formRow">
							<button
								class="button primary"
								@click="
									async (event) => {
										if (
											appStore.rule &&
											(appStore.rule?.global_rule_id as string | null) === null
										) {
											await appStore.addRule(appStore.rule as types.KeyValue);
										} else {
											await appStore.saveRule(appStore.rule as types.KeyValue);
										}
									}
								"
								:disabled="!(appStore.rule?.summary as string) || !(appStore.rule?.rule as string)"
							>
								{{
									appStore.rule && (appStore.rule?.global_rule_id as string | null) !== null
										? "Update"
										: "Add"
								}}
								Rule
							</button>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</v-dialog>
</template>

<style lang="scss" scoped></style>
