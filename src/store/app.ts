import { defineStore } from "pinia";
import APIClass from "@/classes/API";
import * as types from "@/types";
import * as functions from "@/functions";
import * as validation from "@/validation";
import moment, { Moment } from "moment-timezone";
import { RouteRecordRaw, useRoute, useRouter } from "vue-router";
import { markRaw, watch, nextTick, ref } from "vue";
import API from "@/classes/API";

const controller = new AbortController();

export interface AppState {
	settings: types.KeyValue;
	globalVars: any;
	authenticated: boolean;
	wss: WebSocket;
	wssReadyState: number;
	wssDialogue: boolean;
	wssDialogueMessage: string;
	wssError: string;
	wssMessage: any;
	wssConnectionAttempt: number;
	wssConnectionAttemptMax: number;
	wssConnectionDelay: number;
	timezone: string;

	perPageDefault: number;
	perPageOptions: number[];

	controller: AbortController;
	signal: AbortSignal;
	collapsed: boolean;
	notificationCount: number;
	notifications: types.KeyValue[];
	notificationsSearch: string;
	panelClickEventListeners: any[];
	userRole: string;
	userAuth: number | null;
	userName: string;
	userInitials: string;
	headerMenuOpen: boolean;
	headerMenuType: string;
	theme: string;
	router: any;
	loginTokenKey: string;
	versionKey: string;
	API: APIClass;

	timezoneOptions: string[];
	setupComplete: boolean;

	selectedGuideRuleOptions: types.KeyValue[] | null;
	selectedHardRuleOptions: types.KeyValue[] | null;
	guideRuleOptions: types.KeyValue[];
	hardRuleOptions: types.KeyValue[];

	selectedCustomModelOption: types.KeyValue | null;
	customModelOptions: types.KeyValue[];
	avatarAudioLevel: number;
	avatarResponse: string;
	avatarIsLoading: boolean;
	prompt: string;
	avatarTTS: types.KeyValue | null;
	setupDialogue: boolean;
	avatarSettings: types.KeyValue;
	avatarVoices: types.KeyValue[];
	avatarPersonalities: types.KeyValue[];
	rules: types.KeyValue[];
	ruleKeyword: string;
	ruleDialogue: boolean;
	rule: types.KeyValue | null;
	threadKeyword: string;
	thread: types.KeyValue[];
	showLoadMore: boolean;
	totalAvailableThread: number;
	watches: any[];
	intervals: any[];
	events: any[];
	debugTimer: moment.Moment;
	dateFormat: string;
	devDateFormat: string;
	longDateFormat: string;
	timeFormat: string;
	militaryTimeFormat: string;
	backendURL: string;
	startVars: types.KeyValue | null;
	pages: types.KeyValue[];
}
export const useAppStore = defineStore("auth", {
	state: (): AppState => ({
		// // all are camelCase except for db columns, which are snake_case
		settings: {},
		globalVars: {},
		startVars: null,
		authenticated: false,
		wss: {} as WebSocket,
		wssReadyState: 0,
		wssDialogue: true,
		wssDialogueMessage: "Connecting to WSS...",
		wssError: "",
		wssMessage: null,
		wssConnectionAttempt: 0,
		wssConnectionAttemptMax: parseInt(process.env.ENV_WSS_CONNECTION_ATTEMPT_MAX || "100"),
		wssConnectionDelay: parseInt(process.env.ENV_WSS_CONNECTION_DELAY || "5000"),

		timezone: "",

		perPageOptions: [10, 25, 100, 500, 1000],
		perPageDefault: 100,

		controller: controller,
		signal: controller.signal,

		collapsed: false,
		notificationCount: 0,
		notifications: [],
		notificationsSearch: "",
		panelClickEventListeners: [],
		userRole: "",
		userAuth: null,
		userName: "",
		userInitials: "",
		headerMenuOpen: false,
		headerMenuType: "",
		theme: "dark",
		router: null,
		loginTokenKey: process.env.VUE_APP_ENV + "_sz_login_token",
		versionKey: process.env.VUE_APP_ENV + "_sz_version",
		API: new APIClass(),

		timezoneOptions: [],
		setupComplete: false,
		selectedGuideRuleOptions: null,
		guideRuleOptions: [],
		selectedHardRuleOptions: null,
		hardRuleOptions: [],

		selectedCustomModelOption: null,
		customModelOptions: [],
		avatarTTS: null,
		setupDialogue: false,
		avatarSettings: {},
		avatarVoices: [],
		avatarPersonalities: [],
		rules: [],
		ruleKeyword: "",
		ruleDialogue: false,
		rule: null,
		watches: [],
		intervals: [],
		events: [],
		avatarAudioLevel: 0,
		avatarResponse: "",
		avatarIsLoading: false,
		prompt: "",
		debugTimer: moment(),
		threadKeyword: "",
		thread: [],
		showLoadMore: true,
		totalAvailableThread: 0,
		dateFormat: "MM/DD/YYYY",
		devDateFormat: "YYYY-MM-DD",
		longDateFormat: "MMMM Do, YYYY",
		timeFormat: "h:mm A",
		militaryTimeFormat: "HH:mm",
		backendURL:
			process.env.VUE_APP_BACKEND_PROTOCOL +
			"://" +
			process.env.VUE_APP_BACKEND_HOST +
			":" +
			process.env.VUE_APP_BACKEND_PORT,
		pages: [],
	}),
	getters: {
		getAuthenticated: (state: AppState) => state.authenticated,
	},
	actions: {
		async checkVersion() {
			const version = process.env.VUE_APP_VERSION ?? "1.0.1";
			const localStorageVersion = localStorage.getItem(this.versionKey);
			if (!localStorageVersion) {
				localStorage.setItem(this.versionKey, version.toString());
			}
			if (localStorageVersion != version.toString()) {
				localStorage.setItem(this.versionKey, version.toString());
				window.location.reload();
			}
		},
		async parseAIResponse() {},
		async getUsers(
			company_id: string | null = null,
			department_id: string | null = null,
			user_id: string | null = null,
			search: string | null = null,
		) {
			const usersRes = (await this.API.getUsers(
				company_id,
				department_id,
				user_id,
				search,
			)) as unknown as types.KeyValue;
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "info" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("getUsers - usersRes: ", JSON.parse(JSON.stringify(usersRes)));
			}
			if (usersRes.success == true) {
				return usersRes.results as types.KeyValue[];
			}
			return [] as types.KeyValue[];
		},
		async sort(array: types.KeyValue[], key = "name", type = "string") {
			return array.sort((a: types.KeyValue, b: types.KeyValue): number => {
				if (type == "string") {
					if (a[key] && b[key] && a[key] > b[key]) {
						return 1;
					} else if (a[key] && b[key] && a[key] < b[key]) {
						return -1;
					}
					return 0;
				} else {
					if (a[key] && b[key]) {
						return Number(b[key]) - Number(a[key]);
					}
					return 0;
				}
			});
		},
		async setupAppStore() {
			if (!this.setupComplete) {
				if (localStorage.getItem(this.loginTokenKey)) {
					let user_id = null;
					const localStorageToken = ref();
					localStorageToken.value = localStorage.getItem(this.loginTokenKey);
					if (validation.isJSON(localStorageToken.value)) {
						localStorageToken.value = JSON.parse(localStorageToken.value);
						if (localStorageToken.value.user_id) {
							user_id = localStorageToken.value.user_id;
						}
					}
					if (user_id) {
						const startAppRes = await this.API.startApp(user_id as string);
						if (startAppRes.success == true) {
							this.startVars = (startAppRes.results as types.KeyValue[])[0] as types.KeyValue | null;
							if (this.startVars) {
								if (this.startVars.env) {
									for await (const [key, value] of Object.entries(this.startVars.env)) {
										this.globalVars[key] = value;
									}
								}
								if (
									this.globalVars.GLOBAL_DEBUG_LEVEL == "info" ||
									this.globalVars.DEBUG_USER == "foobar"
								) {
									console.log("globalVars: ", JSON.parse(JSON.stringify(this.globalVars)));
								}
								if (this.startVars.settings) {
									this.settings = await this.parseSettings(this.startVars.settings as types.KeyValue);
								}
								if (
									this.globalVars.GLOBAL_DEBUG_LEVEL == "info" ||
									this.globalVars.DEBUG_USER == "foobar"
								) {
									console.log("settings: ", JSON.parse(JSON.stringify(this.settings)));
								}
								await this.getRules();
								await this.getAvatarVoices();
								await this.getUserAvatar();
								await this.getThread(null, 20, false);
								await this.scrollThread();
								if (this.settings && this.settings.setup_complete == 0) {
									this.setupDialogue = true;
								}
								// if (this.wssReadyState == 0 && this.settings.user_id) {
								// 	await this.openWSS(this.settings.user_id as number);
								// }
							}
						}
					}
				}

				this.setupComplete = true;

				this.watches.push(
					watch(
						async () => this.wssMessage,
						async () => {
							if (this.authenticated == true) {
								if (this.wssMessage) {
									switch (this.wssMessage.type) {
										case "department":
											break;
										default:
											break;
									}
								}
							}
						},
					),
				);
				this.watches.push(
					watch(
						async () => this.authenticated,
						async (newAuthenticated, oldAuthenticated) => {
							const newAuthenticatedValue = await newAuthenticated;
							const oldAuthenticatedValue = await oldAuthenticated;
							// if ( newAuthenticatedValue == false || oldAuthenticatedValue == newAuthenticatedValue ) {
							// 	return;
							// }
						},
					),
				);
				// this.intervals.push(
				// 	setInterval(async () => {

				// 	}, activityCheckIntervalMs)
				// );
			}
			return this.setupComplete;
		},
		// async notificationView(event: Event, notification: types.KeyValue) {
		// 	event.preventDefault();
		// 	//update in database, and store's array
		// 	for await (const [index, notificationTemp] of this.notifications.entries()) {
		// 		if (notificationTemp.notification_id == notification.notification_id) {
		// 			notificationTemp.read = 1;
		// 			await this.updateNotification(notificationTemp);
		// 			this.notifications[index].read = 1;
		// 			if (
		// 				( this.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
		// 				this.globalVars.DEBUG_USER == "foobar"
		// 			) {
		// 				console.log(
		// 					"notificationView - notificationTemp: ",
		// 					JSON.parse(JSON.stringify(notificationTemp))
		// 				);
		// 			}
		// 			break;
		// 		}
		// 	}

		// 	// hide the panel
		// 	await this.closeHeaderMenu();

		// 	if (notification.lead_id) {
		// 		await this.findStoreTab(notification.lead_id as string);
		// 	}
		// },
		async login(event: Event) {
			event.preventDefault();
			event.stopPropagation();
			//redirect to login page
			this.router.push("/login");
		},
		async testLogin() {
			await this.API.testAuth().then(async (testAuthRes: any) => {
				if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "mryan") {
					console.log("testLogin - testAuthRes: ", JSON.parse(JSON.stringify(testAuthRes)));
				}
				if (testAuthRes.success) {
					if (Object.hasOwn(testAuthRes, "authenticated") && testAuthRes.authenticated == true) {
						this.authenticated = testAuthRes.authenticated;
					}
				}
			});
		},
		async toggleTheme() {
			if (this.theme == "light") {
				this.theme = "dark";
			} else {
				this.theme = "light";
			}
		},
		async focusField(selector: string) {
			const element: HTMLElement | null = document.querySelector(selector) as HTMLElement | null;
			if (!element) {
				return false;
			}
			if (element) {
				await nextTick();
				let focusTarget: HTMLElement | null = null;
				if (typeof (element as HTMLElement).focus === "function") {
					focusTarget = element;
				} else {
					focusTarget = element.querySelector(
						"input,textarea,[contenteditable='true'],[tabindex]",
					) as HTMLElement;
				}
				if (!focusTarget || typeof (focusTarget as HTMLElement).focus !== "function") {
					return false;
				}
				(focusTarget as HTMLElement).focus();
				return true;
			}
			return false;
		},
		async toggleWidth(page: any) {
			const collapsedWidth = "var(--collapsed-menu-width)";
			const expandedWidth = "var(--menu-width)";
			const sideBar: HTMLElement = document.querySelector("#sideBar") as HTMLElement;
			const menuMeta: HTMLElement = document.querySelector("#menuMeta") as HTMLElement;
			const menuMetaItems: NodeListOf<HTMLElement> = menuMeta.querySelectorAll(
				".metaMenuItem",
			) as NodeListOf<HTMLElement>;
			const headerNavLeft: HTMLElement = document.querySelector("#header #headerNavLeft") as HTMLElement;
			const main: HTMLElement = document.querySelector("#main") as HTMLElement;
			const tabWrapper: HTMLElement = document.querySelector("#tabWrapper") as HTMLElement;
			const tabContentWrapper: HTMLElement = tabWrapper.querySelector(".tabContentWrapper") as HTMLElement;
			const twilioCall: HTMLElement = tabContentWrapper.querySelector(".twilioCall") as HTMLElement;
			const menuItems: NodeListOf<HTMLElement> = document.querySelectorAll(
				".menuItem:not(.subMenuItem)",
			) as NodeListOf<HTMLElement>;
			const subMenus: NodeListOf<HTMLElement> = document.querySelectorAll(".subMenu") as NodeListOf<HTMLElement>;

			if (sideBar.style.width == collapsedWidth) {
				if (menuItems.length > 0) {
					for await (const item of menuItems) {
						if (item as HTMLElement) {
							(item as HTMLElement).style.width = "calc(" + expandedWidth + " - (var(--padding) * 2))";
						}
						const menuItemText: HTMLElement = item.querySelector(".menuItemText") as HTMLElement;
						if (menuItemText as HTMLElement) {
							(menuItemText as HTMLElement).style.opacity = "1";
							(menuItemText as HTMLElement).style.width = "100%";
							(menuItemText as HTMLElement).style.fontSize = "0.9em";
						}
					}
				}
				if (subMenus.length > 0) {
					for await (const subMenu of subMenus) {
						if (subMenu as HTMLElement) {
							(subMenu as HTMLElement).style.width = "calc(" + expandedWidth + " - (var(--padding) * 2))";
							const subMenuChildren: NodeListOf<HTMLElement> = subMenu.querySelectorAll(
								".subMenuChildren .menuItem",
							) as NodeListOf<HTMLElement>;
							if (subMenuChildren.length > 0) {
								for await (const child of subMenuChildren) {
									if (child as HTMLElement) {
										(child as HTMLElement).style.width = "100%";
										const menuItemText: HTMLElement = child.querySelector(
											".menuItemText",
										) as HTMLElement;
										if (menuItemText as HTMLElement) {
											(menuItemText as HTMLElement).style.opacity = "1";
											(menuItemText as HTMLElement).style.width = "100%";
											(menuItemText as HTMLElement).style.fontSize = "0.9em";
										}
									}
								}
							}
						}
					}
				}
				if (sideBar as HTMLElement) {
					(sideBar as HTMLElement).style.width = expandedWidth;
				}
				if (main as HTMLElement) {
					(main as HTMLElement).style.left = "calc(" + expandedWidth + " )";
					(main as HTMLElement).style.width = "calc(100vw - " + expandedWidth + " )";
				}
				if (menuMeta as HTMLElement) {
					(menuMeta as HTMLElement).style.width = "calc(" + expandedWidth + " - var(--padding) * 2)";
					if (menuMetaItems.length > 0) {
						for await (const item of menuMetaItems) {
							if (item as HTMLElement) {
								// (item as HTMLElement).style.width = "calc(" + expandedWidth + " - var(--padding) * 2)";
								const metaMenuItemText: HTMLElement = item.querySelector(
									".metaMenuItemText",
								) as HTMLElement;
								if (metaMenuItemText as HTMLElement) {
									(metaMenuItemText as HTMLElement).style.opacity = "1";
									// ( metaMenuItemText as HTMLElement ).style.height = "auto";
									(metaMenuItemText as HTMLElement).style.fontSize = "0.8em";
								}
							}
						}
					}
				}
				if (tabWrapper as HTMLElement) {
					(tabWrapper as HTMLElement).style.left = expandedWidth;
					if (tabContentWrapper as HTMLElement) {
						const tabWrapperWidth = tabWrapper.clientWidth;
						const sideBarWidth = sideBar.clientWidth;
						(tabContentWrapper as HTMLElement).style.left =
							"calc(1px + " + tabWrapperWidth + "px + var(--menu-width))";
						if (tabContentWrapper.clientWidth > 0) {
							(tabContentWrapper as HTMLElement).style.width = "100%";
							(tabContentWrapper as HTMLElement).style.overflow = "auto";
							(twilioCall as HTMLElement).style.maxWidth = "calc(100vw - (var(--menu-width) ))";
							(main as HTMLElement).style.overflow = "hidden";
						}
					}
				}
				this.collapsed = false;
			} else {
				if (menuItems.length > 0) {
					for await (const item of menuItems) {
						if (item as HTMLElement) {
							(item as HTMLElement).style.width = "calc(" + collapsedWidth + " - (var(--padding) * 2))";
						}
						const menuItemText: HTMLElement = item.querySelector(".menuItemText") as HTMLElement;
						if (menuItemText as HTMLElement) {
							(menuItemText as HTMLElement).style.opacity = "0";
							(menuItemText as HTMLElement).style.width = "0px";
							(menuItemText as HTMLElement).style.fontSize = "0em";
						}
					}
				}
				if (subMenus.length > 0) {
					for await (const subMenu of subMenus) {
						if (subMenu as HTMLElement) {
							(subMenu as HTMLElement).style.width =
								"calc(" + collapsedWidth + " - (var(--padding) * 2))";
							const subMenuChildren: NodeListOf<HTMLElement> = subMenu.querySelectorAll(
								".subMenuChildren .menuItem",
							) as NodeListOf<HTMLElement>;
							if (subMenuChildren.length > 0) {
								for await (const child of subMenuChildren) {
									if (child as HTMLElement) {
										(child as HTMLElement).style.width = "100%";
										const menuItemText: HTMLElement = child.querySelector(
											".menuItemText",
										) as HTMLElement;
										if (menuItemText as HTMLElement) {
											(menuItemText as HTMLElement).style.opacity = "0";
											(menuItemText as HTMLElement).style.width = "0px";
											(menuItemText as HTMLElement).style.fontSize = "0em";
										}
									}
								}
							}
						}
					}
				}
				if (sideBar as HTMLElement) {
					(sideBar as HTMLElement).style.width = collapsedWidth;
				}
				if (main as HTMLElement) {
					(main as HTMLElement).style.left = "calc(" + collapsedWidth + " )";
					(main as HTMLElement).style.width = "calc(100vw - " + collapsedWidth + " )";
				}
				if (menuMeta as HTMLElement) {
					(menuMeta as HTMLElement).style.width = "calc(" + collapsedWidth + " - var(--padding) * 2)";
					if (menuMetaItems.length > 0) {
						for await (const item of menuMetaItems) {
							if (item as HTMLElement) {
								// (item as HTMLElement).style.width = "calc(" + collapsedWidth + " - var(--padding) * 2)";
								const metaMenuItemText: HTMLElement = item.querySelector(
									".metaMenuItemText",
								) as HTMLElement;
								if (metaMenuItemText as HTMLElement) {
									(metaMenuItemText as HTMLElement).style.opacity = "0";
									(metaMenuItemText as HTMLElement).style.fontSize = "0em";
								}
							}
						}
					}
				}

				if (tabWrapper as HTMLElement) {
					(tabWrapper as HTMLElement).style.left = collapsedWidth;
					if (tabContentWrapper as HTMLElement) {
						const tabWrapperWidth = tabWrapper.clientWidth;
						const sideBarWidth = sideBar.clientWidth;
						(tabContentWrapper as HTMLElement).style.left =
							"calc(1px + " + tabWrapperWidth + "px + var(--collapsed-menu-width))";
						if (tabContentWrapper.clientWidth > 0) {
							(tabContentWrapper as HTMLElement).style.width = "100%";
							(tabContentWrapper as HTMLElement).style.overflow = "auto";
							(twilioCall as HTMLElement).style.maxWidth = "calc(100vw - (var(--collapsed-menu-width) ))";
							(tabContentWrapper as HTMLElement).style.overflow = "auto";
							(main as HTMLElement).style.overflow = "hidden";
						}
					}
				}
				this.collapsed = true;
			}
		},
		async parentToggleSubMenu(page: any, event: Event) {
			if (this.collapsed == true && page.meta.subMenuOpen == 0) {
				await this.toggleSubMenu(page, event);
			}
		},
		async toggleSubMenu(page: any, event: Event) {
			if (this.collapsed == false) {
				event.preventDefault();
				event.stopPropagation();
			}
			const subMenu: HTMLElement = document.querySelector(
				`.subMenuChildren[data-section_id="${page.meta.section_id}"]`,
			) as HTMLElement;
			if (subMenu) {
				let newHeight = "0px";
				switch (page.meta.subMenuOpen) {
					case 1:
						page.meta.subMenuOpen = 0;
						newHeight = "0px";
						break;
					case 0:
						page.meta.subMenuOpen = 1;
						newHeight = subMenu.scrollHeight + "px";
						break;
				}

				for await (const pageTemp of this.pages) {
					if (
						(pageTemp.meta as types.KeyValue).page_id?.toString() ==
						(page.meta?.page_id?.toString() as string)
					) {
						(pageTemp.meta as types.KeyValue).subMenuOpen = page.meta.subMenuOpen;
						break;
					}
				}
				(subMenu as HTMLElement).setAttribute("style", `max-height: ${newHeight} !important`);
			}
		},
		async logout() {
			if (this.authenticated) {
				const logoutRes: types.KeyValue = await this.API.logout();
				if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
					console.log("logout - logoutRes: ", JSON.parse(JSON.stringify(logoutRes)));
				}
				if (logoutRes.success) {
					this.authenticated = false;
					this.headerMenuOpen = false;
					this.headerMenuType = "";
					await this.router?.push("/login");
				}
			}
		},
		async parseSettings(settingsTemp: types.KeyValue) {
			const settings = settingsTemp;
			const firstName = settings.first_name ? (settings.first_name as string) : "";
			this.userName = "";
			this.userInitials = "";
			if (firstName) {
				this.userName += firstName;
				this.userInitials += firstName[0];
			}
			const lastName = settings.last_name ? (settings.last_name as string) : "";
			if (firstName && lastName) {
				this.userName += " ";
				this.userInitials += " ";
			}
			if (lastName) {
				this.userName += lastName;
				this.userInitials += lastName[0];
			}

			//timezone
			const momentTimeZone = moment.tz.guess(true);
			this.timezone = momentTimeZone;
			if (!this.timezoneOptions.includes(momentTimeZone)) {
				this.timezoneOptions.push(momentTimeZone);
			}
			if (settings.timezone && settings.timezone !== momentTimeZone) {
				settings.timezone = momentTimeZone;
			}

			//role
			if (settings.Role) {
				if (Array.isArray(settings.Role) && settings.Role.length > 0) {
					settings.role = JSON.parse(JSON.stringify((settings.Role as types.KeyValue[])[0]));
					this.userRole = (settings.Role as types.KeyValue[])[0].name as string;
					this.userAuth = (settings.Role as types.KeyValue[])[0].auth_level as number;
					delete settings.Role;
				}
			}

			return settings;
		},

		async toggleSetupDialogue(open: boolean = false) {
			if (open == true) {
				this.setupDialogue = true;
			} else {
				await this.completeSetup();
				this.setupDialogue = false;
			}
		},
		async completeSetup() {
			const response = await this.API.updateUser({ user_id: this.settings.user_id as number, setup_complete: 1 });
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("completeSetup response", response);
			}
			if (response.success === false) {
				console.error("Failed to complete setup:", response);
			}
		},
		async getThread(promptID: number | null = null, limit: number | null = null, more: boolean = false) {
			if (more == false) {
				this.thread = [];
			}
			const response = await this.API.getThread(
				this.threadKeyword,
				promptID,
				false,
				this.settings.user_id?.toString() ?? "",
				limit,
			);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("getThread response", JSON.parse(JSON.stringify(response)));
			}
			if (response.success === true && Array.isArray(response.results)) {
				let prevDate: string | null = null;
				const newThread: types.KeyValue[] = [];
				for (const result of response.results) {
					const item = JSON.parse(JSON.stringify(result));
					item.time = moment(item.created).format(this.timeFormat);
					item.date = moment(item.created).format(this.longDateFormat);
					// if (moment(item.created).format(this.devDateFormat) != prevDate) {
					// 	prevDate = moment(item.created).format(this.devDateFormat);
					// 	item.date = moment(item.created).format(this.longDateFormat);
					// }
					if (item.mime_type) {
						switch (item.mime_type) {
							case "image/png":
							case "image/jpeg":
								item.file = '<img src="data:' + item.mime_type + ";base64," + item.base64 + '">';
								break;
						}
					}
					newThread.push(item);
				}
				this.totalAvailableThread = response.total_rows as number;
				if (more == false) {
					this.thread = newThread as types.KeyValue[];
				}
				return newThread as types.KeyValue[];
			}
		},
		async scrollThread(upwards: boolean = false) {
			const communicationThreadWrapper: any = document.querySelector(".threadWrapper");
			if (communicationThreadWrapper) {
				const communicationThread: any = communicationThreadWrapper.querySelector(".thread");
				if (communicationThread) {
					let scrollTop = 0;
					if (communicationThread.clientHeight > communicationThreadWrapper.clientHeight) {
						if (upwards) {
							scrollTop = 0;
						} else {
							scrollTop = communicationThread.clientHeight;
						}
					}
					communicationThreadWrapper.scrollTo({
						top: scrollTop,
						behavior: "smooth",
					});
				}
			}
		},
		async getAvatarVoices() {
			this.avatarVoices = [];
			const response = await this.API.getAvatarVoices();
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("getAvatarVoices response", JSON.parse(JSON.stringify(response)));
			}
			if (response.success === true && Array.isArray(response.results)) {
				this.avatarVoices = response.results as types.KeyValue[];
			}
		},
		async getUserAvatar() {
			this.avatarSettings = {};
			this.avatarPersonalities = [];
			const response = await this.API.getUserAvatar(this.settings.user_id?.toString() ?? "");
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("getUserAvatar response", JSON.parse(JSON.stringify(response)));
			}
			if (response.success == true && Array.isArray(response.results)) {
				const avatarRows = response.results as types.KeyValue[];
				if (avatarRows.length > 0) {
					await this.updateUserAvatarPersona(avatarRows[0] as types.KeyValue);
				}
			}
		},
		async updateUserAvatarPersona(tempAvatarSettings: types.KeyValue) {
			this.avatarPersonalities = [];
			this.avatarSettings = {};
			for (const [key, value] of Object.entries(tempAvatarSettings)) {
				if (key.startsWith("persona_")) {
					const personalityOption = key.replace("persona_", "").toLowerCase().split("_");
					this.avatarPersonalities.push({
						key: key,
						startLabel: personalityOption[0] ?? "",
						endLabel: personalityOption[1] ?? "",
						value: value as types.KeyValue[string],
					});
				}
				this.avatarSettings[key] = value as types.KeyValue[string];
			}
		},
		async saveUserAvatar(tempAvatarSettings: types.KeyValue) {
			await this.updateUserAvatarPersona(tempAvatarSettings);
			const response = await this.API.saveUserAvatar(tempAvatarSettings);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("saveUserAvatar response", JSON.parse(JSON.stringify(response)));
			}
			if (response.success === true) {
				await this.completeSetup();
			}
		},
		// 		async createEmptyRule((): Rule => ({
		// 	global_rule_id: null,
		// 	summary: "",
		// 	rule: "",
		// 	strict: 1,
		// 	deleted: 0,
		// }	;
		async getRules() {
			this.rules = [];
			let response = await this.API.getRules(this.ruleKeyword);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("getRules response", response);
			}
			this.rules = response.results as types.KeyValue[];
		},
		async toggleRuleDialog(toggle: boolean, tempRule: types.KeyValue | null = null) {
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("toggleRuleDialog toggle", toggle);
				console.log("toggleRuleDialog tempRule", tempRule);
			}
			if (toggle) {
				if (tempRule !== null) {
					this.rule = { ...tempRule };
				} else {
					this.rule = {
						global_rule_id: null,
						summary: "",
						rule: "",
						strict: 1,
						deleted: 0,
					};
				}
			} else {
				this.rule = null;
			}
			this.ruleDialogue = toggle;
		},
		async addRule(tempRule: types.KeyValue) {
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("editRule tempRule", tempRule);
			}
			const response = await this.API.addRule(tempRule);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("addRule response", response);
			}
			if (response.success === true) {
				if (this.ruleDialogue === true) {
					await this.toggleRuleDialog(false);
				}
				await this.getRules();
				// this.rule = functions.createEmptyKey();
			} else {
				console.error("Failed to add rule:", response);
			}
		},
		async saveRule(tempRule: types.KeyValue) {
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("saveRule tempRule", tempRule);
			}
			const response = await this.API.saveRule(tempRule);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("saveRule response", response);
			}
			if (response.success === true) {
				await this.getRules();
				// rule.value = createEmptyRule();
				if (this.ruleDialogue === true) {
					await this.toggleRuleDialog(false);
				}
			} else {
				console.error("Failed to save rule:", response);
			}
		},
		async deleteRule(tempRule: types.KeyValue) {
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("deleteRule tempRule", tempRule);
			}
			const response = await this.API.deleteRule(tempRule);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("deleteRule response", response);
			}
			if (response.success === true) {
				await this.getRules();
				// rule.value = createEmptyRule();
				if (this.ruleDialogue === true) {
					await this.toggleRuleDialog(false);
				}
			} else {
				console.error("Failed to delete rule:", response);
			}
		},
		async copyRule(tempRule: types.KeyValue) {
			await this.addRule(tempRule);
		},
		async buttonFeedback(element: HTMLElement, pending = false, success = false, error = false) {
			if (element) {
				const buttonFeedback: HTMLElement | null = element.querySelector(
					"span.buttonFeedback",
				) as HTMLElement | null;

				if (buttonFeedback) {
					const buttonFeedbackDisplay = async () => {
						const buttonInitial: HTMLElement | null = element.querySelector(
							".buttonInitial",
						) as HTMLElement | null;
						if (buttonInitial !== null) {
							if (pending == true || success == true || error == true) {
								if ((getComputedStyle(buttonInitial as HTMLElement).opacity as string) != "0") {
									(buttonInitial as HTMLElement).style.opacity = "0";
								}
							} else {
								if ((getComputedStyle(buttonInitial as HTMLElement).opacity as string) != "1") {
									(buttonInitial as HTMLElement).style.opacity = "1";
								}
							}
						}
					};

					if (success || error || pending) {
						(buttonFeedback as HTMLElement).style.display = "inline-block";
						await buttonFeedbackDisplay().then(async () => {
							const buttonFeedbackSuccess: HTMLElement | null = buttonFeedback.querySelector(
								".buttonFeedbackSuccess",
							) as HTMLElement | null;
							if (buttonFeedbackSuccess !== null) {
								if (success === true) {
									(buttonFeedbackSuccess as HTMLElement).style.display = "inline-block";
								} else {
									(buttonFeedbackSuccess as HTMLElement).style.display = "none";
								}
							}

							const buttonFeedbackError: HTMLElement | null = buttonFeedback.querySelector(
								".buttonFeedbackError",
							) as HTMLElement | null;
							if (buttonFeedbackError !== null) {
								if (error === true) {
									(buttonFeedbackError as HTMLElement).style.display = "inline-block";
								} else {
									(buttonFeedbackError as HTMLElement).style.display = "none";
								}
							}

							const buttonFeedbackPending: HTMLElement | null = buttonFeedback.querySelector(
								".buttonFeedbackPending",
							) as HTMLElement | null;
							if (buttonFeedbackPending !== null) {
								if (pending === true) {
									(buttonFeedbackPending as HTMLElement).style.display = "inline-block";
								} else {
									(buttonFeedbackPending as HTMLElement).style.display = "none";
								}
							}
						});
					} else {
						(buttonFeedback as HTMLElement).style.display = "none";
					}
				}
			}
		},

		async toggleHeaderMenu(event: any, target: string) {
			if (target) {
				this.headerMenuType = target;
			}
			if (this.headerMenuOpen == false) {
				this.headerMenuOpen = true;
			} else {
				this.headerMenuOpen = false;
			}
			const headerNavItemHeaderLink = event.target.closest(".headerNavItemHeaderLink") as HTMLElement;
			await this.delay(100).then(async () => {
				if (headerNavItemHeaderLink) {
					const dialogueTarget = "." + this.headerMenuType + "DialogueWrapper";
					const dialogueWrapper = document.querySelector(dialogueTarget) as HTMLElement | null;
					if (dialogueWrapper) {
						const dialogue = dialogueWrapper.querySelector(".dialogue") as HTMLElement;
						if (dialogue) {
							const headerNavWidth = headerNavItemHeaderLink.clientWidth;
							const windowWidth = window.innerWidth;
							const dialogueRight =
								windowWidth - headerNavItemHeaderLink.offsetLeft - headerNavWidth - 10;
							let arrowRight = headerNavWidth / 2;
							const arowRightMin = 15;
							if (arrowRight < arowRightMin) {
								arrowRight = arowRightMin;
							}

							const headerNavItemArrow = dialogue.querySelector(".headerNavItemArrow") as HTMLElement;
							if (headerNavItemArrow) {
								dialogue.style.right = dialogueRight + "px";
								headerNavItemArrow.style.right = arrowRight + "px";
								dialogue.style.opacity = "1";
							}
							switch (this.headerMenuType) {
								case "notifications":
									break;
							}
						}
					}
				}
			});
		},
		async closeHeaderMenu() {
			this.headerMenuOpen = false;
			this.headerMenuType = "";
		},

		async openWSS(user_id: number) {
			try {
				if (this.authenticated) {
					if (this.wssReadyState === 1 && this.wss) {
						await this.closeWSS();
					}

					let wssURL = "";
					wssURL += this.globalVars.WSS_PROTOCOL;
					wssURL += "://" + this.globalVars.WSS_HOST;
					wssURL += ":" + this.globalVars.WSS_PORT;
					wssURL += "?userID=" + user_id.toString();
					wssURL += "&userTimezone=" + this.timezone;
					if (localStorage.getItem(this.loginTokenKey)) {
						const localStorageToken = ref();
						localStorageToken.value = localStorage.getItem(this.loginTokenKey);
						if (validation.isJSON(localStorageToken.value)) {
							localStorageToken.value = JSON.parse(localStorageToken.value);
							if (localStorageToken.value.login_token) {
								wssURL += "&loginToken=" + localStorageToken.value.login_token;
							}
						}
					}
					if (this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" || this.globalVars.DEBUG_USER == "foobar") {
						console.error("openWSS wssURL: ", wssURL);
					}

					const wss = new WebSocket(wssURL);
					this.wss = wss;
					wss.onopen = async (event: Event) => {
						if (this.wss !== wss) {
							return;
						}
						if (event.type == "open" && wss.readyState === WebSocket.OPEN) {
							wss.send(
								JSON.stringify({
									type: "init",
									user_id: this.settings.user_id,
									user_timezone: this.timezone,
								}),
							);
							this.wssReadyState = 1;
							this.wssDialogue = false;
							this.wssConnectionAttempt = 0;
						}
					};
					wss.onmessage = async (event) => {
						if (this.wss !== wss) {
							return;
						}
						let wssMessage: any = false;
						if (validation.isJSON(event.data)) {
							wssMessage = JSON.parse(event.data);
							if (this.globalVars.GLOBAL_DEBUG_LEVEL == "info") {
								console.log("wssMessage: ", JSON.parse(JSON.stringify(wssMessage)));
							}

							switch (wssMessage.type) {
								case "ping":
									if (this.globalVars.GLOBAL_DEBUG_LEVEL == "info") {
										console.log("wssMessage ping: ", JSON.parse(JSON.stringify(wssMessage)));
									}
									if (wss.readyState === WebSocket.OPEN) {
										// High-risk operation: sends data over websocket; requires human review.
										wss.send(
											JSON.stringify({
												type: "pong",
												user_id: this.settings.user_id,
												user_timezone: this.timezone,
											}),
										);
									}
									break;
								case "offline":
									if (this.globalVars.GLOBAL_DEBUG_LEVEL == "info") {
										console.log("wssMessage status: ", JSON.parse(JSON.stringify(wssMessage)));
									}
									await this.closeWSS();
									break;
								default:
									this.wssMessage = wssMessage;
									break;
							}
						}
					};
					wss.onerror = async (event: Event) => {
						if (
							this.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
							this.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
							this.globalVars.GLOBAL_DEBUG_LEVEL == "info"
						) {
							console.error("wss.onerror error: ", event);
						}
						if (this.wss !== wss) {
							return;
						}
						this.wssError = (event as ErrorEvent).message as string;
						this.wssReadyState = 2;
						this.wssDialogue = true;
					};
					wss.onclose = async (event: CloseEvent) => {
						if (this.wss !== wss) {
							return;
						}
						this.wssReadyState = 0;
						this.wssDialogue = true;
					};
				}
			} catch (error: any) {
				if (
					this.globalVars.GLOBAL_DEBUG_LEVEL == "errors" ||
					this.globalVars.GLOBAL_DEBUG_LEVEL == "warnings" ||
					this.globalVars.GLOBAL_DEBUG_LEVEL == "debug" ||
					this.globalVars.GLOBAL_DEBUG_LEVEL == "info"
				) {
					console.error("openWSS error: ", error);
				}
				await this.logError(error);
			}
		},
		async closeWSSDialogue() {
			this.wssDialogue = false;
		},
		async closeWSS() {
			if (this.authenticated && this.wss) {
				this.wss.close();
			}
		},
		async delay(ms = 3000) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		},

		async parseError(error: any) {
			const IP: string | null = await this.API.getIP();
			const currentUrl: string | null = window.location.href;
			const message: string | null = error.message;
			let userAgent: string | null = null;
			if (navigator.userAgent) {
				userAgent = navigator.userAgent;
				userAgent = userAgent.split(") ").join("</li><li>");
				userAgent = "<ul><li>" + userAgent + "</li></ul>";
			}
			let stack: string | null = null;
			let lineNumber: number | null = null;
			let fileName: string | null = null;
			if (error.lineNumber) {
				lineNumber = error.lineNumber;
				fileName = error.fileName;
			} else {
				const stackLines = error.stack.split("\n");
				if (stackLines.length > 1) {
					const firstStackLine = stackLines[1];
					const match = firstStackLine.match(/([a-zA-Z0-9._]+):(\d+):(\d+)/);
					if (match) {
						lineNumber = match[2];
						fileName = match[1];
					}
				}
			}
			if (error.stack && stack !== null) {
				stack = error.stack;
				if (stack !== null) {
					stack = stack.replace(/\n/g, "</li><li>");
					stack = "<ul><li>" + stack + "</li></ul>";
				}
			}
			const errorTemp: types.KeyValue = {};
			if (message) {
				errorTemp.message = message.toString();
			}
			if (lineNumber) {
				errorTemp.line = lineNumber;
			}
			if (fileName) {
				errorTemp.file = fileName;
			}
			if (userAgent) {
				errorTemp.user_agent = userAgent;
			}
			if (IP) {
				errorTemp.user_ip = IP;
			}
			if (currentUrl) {
				errorTemp.url = currentUrl;
			}
			if (stack && stack !== null) {
				errorTemp.stack = stack;
			}
			return errorTemp;
		},
		async logError(error: any) {
			const errorTemp: types.KeyValue = await this.parseError(error);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "info" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("logError: errorTemp: ", JSON.parse(JSON.stringify(errorTemp)));
			}
			const addErrorRequest: types.KeyValue = await this.API.addError(errorTemp);
			if (this.globalVars.GLOBAL_DEBUG_LEVEL == "info" || this.globalVars.DEBUG_USER == "foobar") {
				console.log("logError: addErrorRequest: ", JSON.parse(JSON.stringify(addErrorRequest)));
			}
		},

		// async getNotifications(notification_id = "", search = "") {
		// 	this.notificationCount = 0;
		// 	if (this.settings.user_id) {
		// 		const temp = await this.API.getNotifications(
		// 			this.settings.user_id as string,
		// 			[0, 1],
		// 			[0],
		// 			notification_id,
		// 			search
		// 		);
		// 		if (
		// 			( this.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
		// 			this.globalVars.DEBUG_USER == "foobar"
		// 		) {
		// 			console.log("getNotifications: temp: ", JSON.parse(JSON.stringify(temp)));
		// 		}
		// 		if (temp.success) {
		// 			temp.results = temp.results as types.KeyValue[];
		// 			if (temp.results && temp.results.length > 0) {
		// 				for await (const notification of temp.results) {
		// 					if (notification.created) {
		// 						notification.created = moment
		// 							.utc(notification.created as string, "YYYY/MM/DD hh:mm")
		// 							.tz(this.timezone)
		// 							.format("YYYY/MM/DD hh:mm A");
		// 					}
		// 					if (notification.read == 0) {
		// 						this.notificationCount++;
		// 					}
		// 				}
		// 				return temp.results;
		// 			}
		// 		}
		// 	}
		// 	return [];
		// },
		// async notificationSearchKeyup(event: any) {
		// 	event.preventDefault();
		// 	this.notifications = await this.getNotifications("", this.notificationsSearch);
		// },
		// async readNotifications() {
		// 	if (this.notifications) {
		// 		for await (const notification of this.notifications) {
		// 			notification.read = 1;
		// 			await this.updateNotification(notification);
		// 		}
		// 	}
		// },
		// async deleteNotifications() {
		// 	if (this.notifications) {
		// 		for await (const notification of this.notifications) {
		// 			notification.deleted = 1;
		// 			await this.updateNotification(notification);
		// 		}
		// 	}
		// },
		// async updateNotification(notification: types.KeyValue) {
		// 	if (this.settings.user_id) {
		// 		const updateNotificationRes: types.KeyValue = await this.API.updateNotification(
		// 			this.settings.user_id as string,
		// 			notification
		// 		);
		// 		if (
		// 			( this.globalVars.GLOBAL_DEBUG_LEVEL == "info") ||
		// 			this.globalVars.DEBUG_USER == "foobar"
		// 		) {
		// 			console.log(
		// 				"updateNotification: updateNotificationRes: ",
		// 				JSON.parse(JSON.stringify(updateNotificationRes))
		// 			);
		// 		}
		// 		if (updateNotificationRes.success == true) {
		// 			return true;
		// 		}
		// 	}
		// 	return false;
		// },

		timer: (startTimer: moment.Moment) => {
			const endTimer = moment();
			const duration = endTimer.diff(startTimer, "milliseconds");
			return duration;
		},
	},
});
