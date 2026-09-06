<script setup>
// // imports ssss
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { pages } from "@/router/pages";
import { useRoute, useRouter } from "vue-router";
import * as functions from "@/functions";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import moment from "moment-timezone";
import chalk from "chalk";
import util from "util";
import { SkipBack, SkipForward, ChevronLeft, ChevronRight } from "@lucide/vue";

// // composables and classesdfsgsdg
const API = new APIClass();
const appStore = useAppStore();

// // declare variables
const props = defineProps({
	results: {
		type: Array,
		required: true,
	},
	page: {
		type: Object,
		required: true,
	},
	getSpecificPage: {
		type: Function,
		required: true,
	},
});

// // functions
const loadPage = async () => {};
const resetPage = async () => {};

// on mounted
onMounted(async () => {
	await loadPage();
});

// on unmounted
onUnmounted(async () => {
	await resetPage();
});
</script>

<template>
	<div class="pagination" v-if="Array.isArray(props.results) && props.results.length > 0">
		<ul>
			<li v-if="props.page.totalPages > 1">
				<button
					class="paginationIcon"
					@click="async () => await props.getSpecificPage(1)"
					:disabled="props.page.currentPage == 1"
				>
					<SkipBack />
				</button>
			</li>
			<li
				v-for="page in props.page.totalPages"
				:key="page"
				@click="async () => await props.getSpecificPage(page)"
				:disabled="page == props.page.currentPage"
				:class="{ currentPage: page == props.page.currentPage }"
			>
				<button
					class="paginationButton"
					v-if="
						parseInt(page) <= parseInt(props.page.totalPages) &&
						parseInt(page) > 0 &&
						parseInt(page) <= parseInt(props.page.currentPage) + 7 &&
						parseInt(page) >= parseInt(props.page.currentPage) - 7
					"
				>
					{{ parseInt(page) }}
				</button>
			</li>
			<li v-if="props.page.currentPage < props.page.totalPages">
				<button
					class="paginationIcon"
					@click="async () => await props.getSpecificPage(props.page.totalPages)"
					:disabled="props.page.currentPage == props.page.totalPages"
				>
					<SkipForward />
				</button>
			</li>
		</ul>
	</div>
</template>
