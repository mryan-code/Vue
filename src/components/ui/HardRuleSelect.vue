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
const toggleAll = () => {
	if (appStore.selectedHardRuleOptions == null) {
		appStore.selectedHardRuleOptions = [];
	}
	appStore.hardRuleOptions.forEach((option) => {
		if (!appStore.selectedHardRuleOptions.includes(option.value) && option.value != null) {
			appStore.selectedHardRuleOptions.push(option);
		}
	});
};
const toggleItem = (option) => {
	if (appStore.selectedHardRuleOptions == null) {
		appStore.selectedHardRuleOptions = [];
	}
	if (props.multiple == false) {
		appStore.selectedHardRuleOptions = [option];
		return;
	}
	if (option.value == null) {
		appStore.selectedHardRuleOptions = [];
	}
	if (!appStore.selectedHardRuleOptions.includes(option)) {
		appStore.selectedHardRuleOptions.push(option);
	}
	if (appStore.selectedHardRuleOptions.includes({ label: "None", value: null })) {
		appStore.selectedHardRuleOptions = appStore.selectedHardRuleOptions.filter(
			(selectedOption) => selectedOption.value != null
		);
	}
};
const removeItem = (option) => {
	appStore.selectedHardRuleOptions.forEach((selectedOption) => {
		if (selectedOption.value == option.value) {
			appStore.selectedHardRuleOptions.splice(appStore.selectedHardRuleOptions.indexOf(selectedOption), 1);
		}
	});
	if (appStore.selectedHardRuleOptions.length == 0) {
		appStore.selectedHardRuleOptions = null;
	}
};
const loadPage = async () => {
	// await appStore.testLogin();
	if (appStore.authenticated == true) {
		appStore.hardRuleOptions = await getOptions();
	}
};
const getOptions = async () => {
	const hardRuleOptions = [];
	if (props.nullOption === true) {
		const hardRuleOptionNull = {
			label: "None",
			value: null,
		};
		hardRuleOptions.push(hardRuleOptionNull);
	}
	const hardRuleRes = await API.getHardRules(appStore.company_id, null, null, null);
	if (hardRuleRes.success == true) {
		for await (const hardRule of hardRuleRes.results) {
			const hardRuleOption = {};
			hardRuleOption["label"] = hardRule.name;
			hardRuleOption["value"] = hardRule.id;
			if (!hardRuleOptions.includes(hardRuleOption)) {
				hardRuleOptions.push(hardRuleOption);
			}
		}
	}
	return hardRuleOptions;
};

// watch functions
watch(
	async () => appStore.selectedHardRuleOptions,
	async () => {
		if (props.report == true) {
			return;
		}
		if (props.editObject) {
			const updateObject = {
				hard_rule_id: appStore.selectedHardRuleOptions[0],
			};
			emit("update:hardRule", updateObject);
		}
	}
);
// on mounted
onMounted(async () => {
	await loadPage();
});

// on unmounted
onUnmounted(async () => {});
</script>

<template>
	<v-select
		v-model="appStore.selectedHardRuleOptions"
		:items="appStore.hardRuleOptions"
		:hide-selected="true"
		width="fit-content"
		density="compact"
		:flat="true"
		variant="plain"
		:hide-details="true"
		:hide-no-data="true"
		:item-props="true"
		:menu-props="
			props.multiple === false
				? { closeOnClick: true, closeOnContentClick: true }
				: { closeOnClick: false, closeOnContentClick: false }
		"
		:single-line="props.multiple === false ? true : false"
		v-if="appStore.hardRuleOptions"
		class="customSelect"
		:multiple="props.multiple"
		:attach="'#main'"
	>
		<template v-slot:selection="{ item }">
			<span class="customOption">
				<span v-if="item.value != null">
					<span class="customOptionLabel">{{ item.label }}</span>
					<X
						href="javascript:void(0)"
						@click.prevent="removeItem(item)"
						v-if="props.multiple"
						class="customOptionRemove"
					>
					</X>
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
