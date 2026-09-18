<script setup>
// // imports
import { computed, onMounted, onUnmounted, ref, watch, onErrorCaptured } from "vue";
import APIClass from "@/classes/API";
// import { allPages, pages } from "@/router/pages";
import allPages from "@/router/pages.json";
import { useRoute, useRouter } from "vue-router";
import * as functions from "@/functions";
import moment from "moment-timezone";
import { useAppStore } from "@/store/app";
import { storeToRefs } from "pinia";
import Lucide from "@/components/Lucide.vue";
import { Menu, Moon, Sun, ChevronDown, ChevronUp, LogOut, LogIn } from "@lucide/vue";
import WSSDialogue from "@/components/WSSDialogue.vue";
import MainMenu from "@/components/MainMenu.vue";

import { useVisitorData } from "@fingerprint/vue";

const { data, error, isLoading, getData } = useVisitorData({
	immediate: false,
});
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

// // composables and classes
const API = new APIClass();

// // declare variables
const loadPageRanForAuth = ref(false);

// // functions
const loadPage = async () => {
	appStore.logoText = process.env.VUE_APP_NAME?.split(" ") || [];
	appStore.pages = JSON.parse(JSON.stringify(allPages));
	if (appStore.authenticated == true) {
		await appStore.setupAppStore();
	}
};
const resetPage = async () => {
	// console.log("resetPage");
	if (appStore.authenticated == true) {
		if (appStore.wssReadyState) {
			await appStore.closeWSS();
			appStore.wss = null;
		}
		if (appStore.watches.length > 0) {
			appStore.watches.forEach((watch) => {
				watch.stop();
			});
		}
		// if (appStore.intervals.length > 0) {
		// 	appStore.intervals.forEach((interval) => {
		// 		clearInterval(interval);
		// 	});
		// }
		// if (appStore.events.length > 0) {
		// 	appStore.events.forEach((event) => {
		// 		window.removeEventListener(event.type, event.callback);
		// 	});
		// }
	}
};
// watch functions
watch(
	async () => appStore.wssReadyState,
	async (newReadyState, oldReadyState) => {
		if (appStore.authenticated == true) {
			newReadyState = await newReadyState;
			oldReadyState = await oldReadyState;
			// console.log("newReadyState: ", newReadyState);
			// console.log("oldReadyState: ", oldReadyState);
			if (newReadyState !== 2 && newReadyState !== 1) {
				appStore.wssDialogue = true;
				if (appStore.wssConnectionAttempt <= appStore.wssConnectionAttemptMax) {
					appStore.wssConnectionAttempt++;
					await appStore.delay(appStore.wssConnectionDelay);
					await appStore.openWSS(appStore.settings.user_id);
				}
			}
		}
	},
);
watch(
	async () => appStore.authenticated,
	async () => {
		if (appStore.authenticated === false) {
			loadPageRanForAuth.value = false;
			return;
		}
		if (appStore.authenticated === true && loadPageRanForAuth.value === false) {
			loadPageRanForAuth.value = true;
			await loadPage();
		}
	},
);
appStore.watches.push(
	watch(
		async () => router.currentRoute.value,
		async () => {
			// const currentRoute = this.router.currentRoute.value;
			// if (currentRoute.meta.section_id) {
			// 	const section = document.querySelector(
			// 		`.subMenuChildren[data-section_id="${currentRoute.meta.section_id}"]`,
			// 	) as HTMLElement | null;
			// }
			//close header menu
			appStore.headerMenuOpen = false;
			if (appStore.authenticated == true && appStore.setupComplete == false) {
				await appStore.setupAppStore();
			}
		},
	),
);

onErrorCaptured(async (error) => {
	await appStore.logError(error);
	return false;
});

// on mounted
onMounted(async () => {
	await loadPage();

	if (appStore.authenticated === true) {
		loadPageRanForAuth.value = true;
	}
});

// on unmounted
onUnmounted(async () => {
	await resetPage();
});
</script>

<template>
	<div :id="router.currentRoute.value.meta.slug" class="webApp" :data-theme="appStore.theme">
		<div id="header">
			<Transition name="fade">
				<div class="headerContent">
					<router-link :to="'/'" class="logofull noselect">
						<div class="logo">
							<img :src="'/img/dev.svg'" />
						</div>
						<div class="wordmark">
							<h1>WebDev</h1>
							<h1>Matt</h1>
						</div>
					</router-link>
					<div id="headerNavRight">
						<div class="headerNavRightItem noselect">
							<div class="headerNavItemHeader">
								<a
									class="headerNavItemHeaderLink"
									href="javascript:void(0)"
									@click="async (event) => await appStore.toggleTheme(event)"
								>
									<div class="headerNavItemHeaderIcon">
										<Moon v-if="appStore.theme == 'light'" />
										<Sun v-if="appStore.theme == 'dark'" />
									</div>
								</a>
							</div>
						</div>
						<div class="headerNavRightItem noselect">
							<div class="headerNavItemHeader">
								<a
									class="headerNavItemHeaderLink"
									href="javascript:void(0)"
									@click="async (event) => await appStore.logout(event)"
									v-if="appStore.authenticated == true"
								>
									<div class="headerNavItemHeaderIcon">
										<LogOut />
									</div>
								</a>
								<a
									class="headerNavItemHeaderLink"
									href="javascript:void(0)"
									@click="async (event) => await appStore.login(event)"
									v-else
								>
									<div class="headerNavItemHeaderIcon">
										<LogIn />
									</div>
								</a>
							</div>
						</div>
						<div class="headerNavRightItem noselect">
							<div class="headerNavItemHeader">
								<a
									class="headerNavItemHeaderLink"
									href="javascript:void(0)"
									id="menu"
									@click="async (event) => await appStore.toggleHeaderMenu(event, 'menu')"
								>
									<div class="headerNavItemHeaderIcon"><Menu /></div>
								</a>
							</div>
						</div>
						<v-dialog
							activator="#menu"
							v-model="appStore.headerMenuOpen"
							v-if="appStore.headerMenuType == 'menu'"
							@update:model-value="appStore.closeHeaderMenu"
							class="menuDialogueWrapper dialogueWrapper headerDialogueWrapper noselect"
							:attach="'#main'"
							:persistent="false"
							transition="none"
						>
							<div class="dialogue">
								<div class="headerNavItemArrow"></div>
								<div class="headerNavItemContentWrapper">
									<div class="headerNavItemContent" id="menu">
										<ul>
											<li v-for="(page, index) in appStore.pages" :key="index">
												<RouterLink
													:to="page.path"
													:replace="true"
													v-if="
														(appStore.authenticated == true &&
															(page.meta.auth_required == 1 ||
																page.meta.auth_required == 3) &&
															appStore.settings.role &&
															appStore.settings.role.auth_level <=
																page.meta.auth_level) ||
														(appStore.authenticated == false &&
															(page.meta.auth_required == 2 ||
																page.meta.auth_required == 3) &&
															page.meta &&
															page.meta.location == 1)
													"
												>
													<div class="menuItem">
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
															<span
																class="menuItemText"
																v-if="page.name && !appStore.collapsed"
																>{{ page.name }}</span
															>
														</Transition>
													</div>
												</RouterLink>
											</li>
										</ul>
									</div>
								</div>
							</div>
						</v-dialog>
					</div>
				</div>
			</Transition>
		</div>

		<!-- <div id="sideBar" v-if="appStore.authenticated && appStore.wssReadyState == 1">
			<MainMenu />
		</div> -->

		<div id="main">
			<div id="mainContent">
				<Transition name="fade">
					<div id="viewContent">
						<v-expansion-panels
							v-if="
								appStore.globalVars.GLOBAL_DEBUG_LEVEL == 'debug' ||
								appStore.globalVars.DEBUG_USER == 'foobar'
							"
						>
							<v-expansion-panel title="Global Variables">
								<template #text>
									<pre>{{ JSON.stringify(appStore.globalVars, null, 2) }}</pre>
								</template>
							</v-expansion-panel>
							<v-expansion-panel title="Settings">
								<template #text>
									<pre>{{ JSON.stringify(appStore.settings, null, 2) }}</pre>
								</template>
							</v-expansion-panel>
						</v-expansion-panels>
						<router-view />
						<!-- <WSSDialogue v-if="appStore.authenticated == true" /> -->
					</div>
				</Transition>
			</div>
		</div>
	</div>
</template>

<style lang="scss"></style>
