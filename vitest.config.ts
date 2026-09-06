import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
	plugins: [vue()],
	test: {
		// Use jsdom so Vue component tests can be added without reconfiguring Vitest.
		environment: "jsdom",
		include: ["tests/**/*.{test,spec}.{js,ts}"],
		globals: false,
		clearMocks: true,
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
