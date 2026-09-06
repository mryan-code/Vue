<!-- components/DynamicLucideIcon.vue -->
<script setup lang="ts">
import { computed, defineAsyncComponent, defineComponent } from "vue";
import * as functions from "@/functions";
import { useAppStore } from "@/store/app";

const appStore = useAppStore();

const props = defineProps<{
	name: string;
	size?: number | string;
	color?: string;
	strokeWidth?: number | string;
}>();

const EmptyIcon = defineComponent({
	name: "LucideEmptyIcon",
	render() {
		return null;
	},
});

// Dynamically import the specific icon component
// IMPORTANT: this must be a sync computed; returning a Promise here makes Vue try to render a Promise as a component.
const iconComponent = computed(() => {
	return defineAsyncComponent(async () => {
		const lucideIcon = await functions.lucideIcon(props.name);

		try {
			const mod: any = await import(`@lucide/vue/dist/esm/icons/${lucideIcon}.js`);
			return mod?.default ?? mod ?? EmptyIcon;
		} catch (error) {
			if (
				appStore.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
				appStore.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
				appStore.globalVars.GLOBAL_DEBUG_LEVEL == "info" ||
				appStore.globalVars.DEBUG_USER == "mryan"
			) {
				console.error(`Icon "${lucideIcon}" not found`, error);
			}
			return EmptyIcon;
		}
	});
});
</script>

<template>
	<component :is="iconComponent" v-if="props.name" :size="size" :color="color" :stroke-width="strokeWidth" />
</template>
