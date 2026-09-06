import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
// import { pages } from "./pages";
import pagesJson from "./pages.json";
import { useAppStore } from "@/store/app";

interface PageRouteDefinition {
	path: string;
	name: string;
	meta: Record<string, unknown>;
	component: string;
	props?: boolean;
}

// JSON route definitions store view paths as strings; Vue Router needs lazy import functions.
function toRouteRecord(page: PageRouteDefinition): RouteRecordRaw {
	const viewFile = page.component.replace(/^\.\.\/views\//, "").replace(/^@\/views\//, "");
	return {
		path: page.path,
		name: page.name,
		meta: page.meta,
		props: page.props,
		component: () => import("@/views/" + viewFile),
	};
}

const pages = (pagesJson as PageRouteDefinition[]).map(toRouteRecord);

const router = createRouter({
	history: createWebHistory(),
	routes: pages,
});

router.beforeEach(async (to, from, next) => {
	const appStore = useAppStore();
	await appStore.testLogin();

	const regex =
		/(?<full>(?<path>(?:[/]{1})(?:[A-Za-z0-9]{1,}))(?<param>(?:[/]{1})(?:[/:A-Za-z0-9_]{1,})(?:[?]{1})?))/g;
	const publicPages: any = [];
	const protectedPages: any = [];
	let toPath = to.path.toString();
	const testPath = regex.exec(toPath);
	if (testPath) {
		if (testPath.groups) {
			if (testPath.groups.path) {
				toPath = testPath.groups.path.toString();

				for await (const page of pages) {
					if (page.meta) {
						if (page.meta.auth_required !== 1) {
							if (page.path) {
								let pagePath = page.path.toString();
								regex.lastIndex = 0;
								const testPath = regex.exec(pagePath);
								if (testPath) {
									if (testPath.groups) {
										if (testPath.groups.path) {
											pagePath = testPath.groups.path.toString();
										}
									}
								}
								//console.log("test public pagePath", pagePath);
								publicPages.push(pagePath);
							}
						}
						if (page.meta.auth_required == 1 || page.meta.auth_required == 3) {
							if (page.path) {
								let pagePath = page.path.toString();
								regex.lastIndex = 0;
								//console.log("test protected pagePath", pagePath);
								const testPath = regex.exec(pagePath);
								if (testPath) {
									//console.log("test protected testPath", testPath);
									if (testPath.groups) {
										//console.log("test protected testPath.groups", testPath.groups);
										if (testPath.groups.path) {
											//console.log("test protected testPath.groups.path", testPath.groups.path);
											pagePath = testPath.groups.path.toString();
										}
									}
								}
								//console.log("test projected pagePath", pagePath);
								protectedPages.push(pagePath);
							}
						}
					}
				}
				if (appStore.authenticated == false && !publicPages.includes(toPath)) {
					if (to.path !== "/login") {
						next({ path: "/login" });
						return false;
					}
					next();
					return true;
				}
				if (appStore.authenticated == true && !protectedPages.includes(toPath)) {
					if (to.path !== "/") {
						next({ path: "/" });
						return false;
					}
					next();
					return true;
				}
			}
		}
	}

	next();
});

// router.afterEach((to, from) => {
// 	console.log("to: ", to.path);
// 	console.log("from: ", from.path);
// 	const appStore = useAppStore();
// 	await appStore.setStartActivity();
// 	await appStore.testLogin();
// });

export { router };
