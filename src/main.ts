import { createApp, markRaw, ref } from "vue";
import App from "@/App.vue";
import { router } from "@/router";
import type { Router } from "vue-router";
import * as functions from "@/functions";
import { createPinia } from "pinia";

// // mdi
import mdiVue from "mdi-vue/v3";
import * as mdijs from "@mdi/js";
const app = createApp(App);

//fingerprintjs setup
import { FingerprintPlugin } from "@fingerprint/vue";

// Vuetify
import { createVuetify } from "vuetify";
import "vuetify/styles";
import * as labsComponents from "vuetify/labs/components";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
const vuetify = createVuetify({
	components: {
		...components,
		...labsComponents,
	},
	directives,
	theme: {
		defaultTheme: "dark",
	},
	icons: {
		defaultSet: "mdi",
	},
});

// my styleSheet
import "./assets/styles/index.scss";

//pinia setup
declare module "pinia" {
	export interface PiniaCustomProperties {
		router: Router;
	}
}
const pinia = createPinia();
pinia.use(({ store }) => {
	store.router = markRaw(router);
});

app.use(FingerprintPlugin, {
	apiKey: "kYH1ltqyJCmplB3xEdrC",
});

app.use(pinia);
app.use(router);
app.use(vuetify);
app.use(mdiVue, { icons: mdijs });
app.mount("#app");
