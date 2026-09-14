import { RouteRecordRaw, RouteRecordSingleView } from "vue-router";
import * as types from "@/types";
import APIClass from "@/classes/API";
import pinia from "../store/index";
import { AppState, useAppStore } from "../store/app";
const API = new APIClass();
const appStore = useAppStore(pinia);
const pages: Array<RouteRecordRaw> = [];
// Vite only bundles dynamic imports that match a glob; string concatenation is not analyzed.
const viewModules = import.meta.glob("../views/*.vue");

await API.getPages()
	.then(async (response: types.KeyValue) => {
		if (appStore.globalVars?.GLOBAL_DEBUG_LEVEL == "debug" || appStore.globalVars?.DEBUG_USER == "foobar") {
			console.log("pages.ts response: ", JSON.parse(JSON.stringify(response)));
		}
		if (response.results && Array.isArray(response.results) && response.results.length > 0) {
			for await (const rowTemp of response.results) {
				const viewFile = String(rowTemp.component)
					.replace(/^\.\.\/views\//, "")
					.replace(/^@\/views\//, "");
				const component = viewModules[`../views/${viewFile}`];
				if (!component) {
					throw new Error(`Unknown view module "../views/${viewFile}".`);
				}
				const route: RouteRecordSingleView = {
					path: rowTemp.path,
					name: rowTemp.name,
					meta: {
						page_id: rowTemp.page_id?.toString(),
						description: rowTemp.description || "",
						auth_required: rowTemp.auth_required,
						icon: rowTemp.icon,
						auth_level: rowTemp.auth_level,
						slug: rowTemp.slug,
						location: rowTemp.location,
					},
					component: component,
				};
				pages.push(route);
			}
		}
	})
	.catch(async (error: string) => {
		console.log("error", error);
	});

export { pages };
