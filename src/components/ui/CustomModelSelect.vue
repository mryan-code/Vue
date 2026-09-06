<script setup>
// // imports
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import moment from "moment-timezone";
import { X } from "@lucide/vue";
// // composables and classes
const API = new APIClass();
const appStore = useAppStore();

// // declare variables
const props = defineProps({
	editObject: {
		type: [Object, Boolean],
		required: false,
		default: false,
	},
	report: {
		type: Boolean,
		required: false,
		default: false,
	},
	nullOption: {
		type: Boolean,
		required: false,
		default: true,
	},
	multiple: {
		type: Boolean,
		required: false,
		default: false,
	},
});
const emit = defineEmits(["update:hardRule"]);

// // functions
const toggleItem = (option) => {
	appStore.selectedCustomModelOption = option;
};
const loadPage = async () => {
	// await appStore.testLogin();
	if (appStore.authenticated == true) {
		appStore.customModelOptions = await getOptions();
	}
};
const getOptions = async () => {
	const customModelOptions = [];
	const hardRuleRes = await API.getCustomModels(appStore.settings.user_id);
	if (hardRuleRes.success == true) {
		for await (const hardRule of hardRuleRes.results) {
			const customModelOption = {};
			customModelOption["label"] = hardRule.name;
			customModelOption["value"] = hardRule.id;
			if (!customModelOptions.includes(customModelOption)) {
				customModelOptions.push(customModelOption);
			}
		}
	}
	return customModelOptions;
};
// on mounted
onMounted(async () => {
	await loadPage();
});

// on unmounted
onUnmounted(async () => {});
</script>

<template>
	<v-select
		v-model="appStore.selectedCustomModelOption"
		:items="appStore.customModelOptions"
		:hide-selected="true"
		width="fit-content"
		density="compact"
		:flat="true"
		variant="plain"
		:hide-details="true"
		:hide-no-data="true"
		:item-props="true"
		:menu-props="{ closeOnClick: true, closeOnContentClick: true }"
		:single-line="true"
		v-if="appStore.customModelOptions"
		class="customSelect"
		:attach="'#main'"
	>
		<template v-slot:selection="{ item }">
			<span class="customOption">
				<span v-if="item.value != null">
					<span class="customOptionLabel">{{ item.label }}</span>
				</span>

				<span v-else>None</span>
			</span>
		</template>

		<template #item="{ item }">
			<v-list-item @click="toggleItem(item)" v-if="item.value != null">
				<span class="customOption">
					<span class="customOptionLabel">{{ item.label }}</span>
				</span>
			</v-list-item>
		</template>
	</v-select>
</template>

<style lang="scss" scoped></style>
