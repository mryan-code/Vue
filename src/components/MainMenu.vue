<script setup>
// // imports
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
// import { allPages, pages } from "@/router/pages";
import allPages from "@/router/pages.json";
import { useRoute, useRouter } from "vue-router";
import { useLoading } from "@/composables/general/loading.js";
import * as functions from "@/functions";
import APIClass from "@/classes/API";
import { useAppStore } from "@/store/app";
import moment from "moment-timezone";
import Lucide from "@/components/Lucide.vue";
import { ChevronDown, ChevronUp, Moon, Sun, MessageSquareText } from "@lucide/vue";

// // composables and classes
const API = new APIClass();
const appStore = useAppStore();
const route = useRoute();
const router = useRouter();

// // declare variables

// // functions
const loadPage = async () => {
	// await appStore.testLogin();
	if (appStore.authenticated == true) {
		appStore.pages = JSON.parse(JSON.stringify(allPages));
	}
};

// watch functions
watch(
	async () => appStore.appStore,
	async () => {
		if (appStore.authenticated == true) {
			if (appStore.appStore) {
				document.body.querySelector(".webApp").dataset.theme = appStore.theme;
			}
		}
	},
);

// on mounted
onMounted(async () => {
	await loadPage();
});

// on unmounted
onUnmounted(async () => {});
</script>

<template>
	<div id="menu" class="noselect" v-if="Object.entries(appStore.settings).length > 0" v-cloak>
		<ul>
			<li v-for="(page, index) in appStore.pages" :key="index">
				<div class="subMenu" v-if="page.meta.section_id != null">
					<RouterLink
						:to="page.path"
						:replace="true"
						v-if="
							((appStore.authenticated == true && page.meta.auth_required == 1) ||
								(appStore.authenticated == false && page.meta.auth_required == 2) ||
								page.meta.auth_required == 3) &&
							page.meta.location == 1 &&
							appStore.settings.role &&
							appStore.settings.role.auth_level <= page.meta.auth_level
						"
					>
						<div
							class="menuItem subMenuParent parentMenuItem"
							v-on:click="async (event) => await appStore.parentToggleSubMenu(page, event)"
						>
							<div class="menuItemIcon">
								<Lucide :name="page.meta.icon" v-if="page.meta.icon" />
								<v-tooltip
									activator="parent"
									location="right"
									:persistent="false"
									v-if="page.name && appStore.collapsed"
									>{{ page.name }}</v-tooltip
								>
							</div>
							<Transition name="fade">
								<span class="menuItemText" v-if="page.name && !appStore.collapsed">{{
									page.name
								}}</span>
							</Transition>
							<Transition name="fade">
								<a
									class="subMenuToggle"
									@click="async (event) => await appStore.toggleSubMenu(page, event)"
									v-if="!appStore.collapsed"
								>
									<ChevronDown v-if="page.meta.subMenuOpen == 1" />
									<ChevronUp v-if="page.meta.subMenuOpen == 0" />
								</a>
							</Transition>
						</div>
					</RouterLink>

					<div
						class="subMenuChildren"
						v-if="page.meta.pages.length > 0"
						:data-sub-menu-open="page.meta.subMenuOpen"
						:data-section_id="page.meta.section_id"
					>
						<ul>
							<li v-for="(nestedPage, index) in page.meta.pages" :key="index">
								<RouterLink :to="nestedPage.path" :replace="true">
									<div class="menuItem subMenuItem">
										<div class="menuItemIcon">
											<Lucide :name="nestedPage.meta.icon" v-if="nestedPage.meta.icon" />
											<v-tooltip
												activator="parent"
												location="right"
												:persistent="false"
												v-if="nestedPage.name && appStore.collapsed"
												>{{ nestedPage.name }}</v-tooltip
											>
										</div>
										<Transition name="fade">
											<span class="menuItemText" v-if="nestedPage.name && !appStore.collapsed">{{
												nestedPage.name
											}}</span>
										</Transition>
									</div>
								</RouterLink>
							</li>
						</ul>
					</div>
				</div>
				<div v-else>
					<pre v-if="appStore.settings">{{ JSON.stringify(appStore.settings, null, 2) }}</pre>
					<RouterLink
						:to="page.path"
						:replace="true"
						v-if="
							((appStore.authenticated == true && page.meta.auth_required == 1) ||
								(appStore.authenticated == false && page.meta.auth_required == 2) ||
								page.meta.auth_required == 3) &&
							page.meta.location == 1 &&
							appStore.settings.role &&
							appStore.settings.role.auth_level <= page.meta.auth_level
						"
					>
						<div class="menuItem parentMenuItem">
							<div class="menuItemIcon">
								<Lucide :name="page.meta.icon" v-if="page.meta.icon" />
								<v-tooltip
									activator="parent"
									location="right"
									:persistent="false"
									v-if="page.name && appStore.collapsed"
									>{{ page.name }}</v-tooltip
								>
							</div>

							<Transition name="fade">
								<span class="menuItemText" v-if="page.name && !appStore.collapsed">{{
									page.name
								}}</span>
							</Transition>
						</div>
					</RouterLink>
				</div>
			</li>
		</ul>
	</div>

	<!-- <div id="menuMeta" v-if="appStore.wssReadyState == 1" class="noselect">
		<ul>
			<li
				:class="appStore.theme == 'light' ? 'lightTheme' : 'darkTheme'"
				@click="async () => await appStore.toggleTheme()"
			>
				<span class="metaMenuItem">
					<div class="metaMenuItemIcon">
						<Moon v-if="appStore.theme == 'light'" />
						<Sun v-if="appStore.theme == 'dark'" />
						<v-tooltip activator="parent" location="top" :persistent="false" v-if="appStore.collapsed"
							>Theme</v-tooltip
						>
					</div>
					<span class="metaMenuItemText">Theme</span>
				</span>
			</li>
		</ul>
	</div> -->
</template>

<style lang="scss" scoped></style>
