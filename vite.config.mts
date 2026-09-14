import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Deprecated Vitest-only config (now merged into this Vite config):
// export default defineConfig({
// 	plugins: [vue()],
// 	test: {
// 		environment: "jsdom",
// 		include: ["tests/**/*.{test,spec}.{js,ts}"],
// 		globals: false,
// 		clearMocks: true,
// 	},
// 	resolve: {
// 		alias: {
// 			"@": fileURLToPath(new URL("./src", import.meta.url)),
// 		},
// 	},
// });

// Vite replaces Vue CLI/webpack so deprecated packages (webpack-chain, consolidate, glob 7, inflight) are no longer pulled in.
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), ["VUE_APP_", "VITE_", "ENV_"]);
	const processEnvDefines: Record<string, string> = {
		"process.env.NODE_ENV": JSON.stringify(mode === "prod" ? "production" : mode),
	};

	// Keep existing process.env.VUE_APP_* reads working without rewriting every store/API call to import.meta.env.
	const envSource: Record<string, string | undefined> = {
		...env,
		...process.env,
	};
	for ( const [key, value] of Object.entries(envSource) ) {
		if (
			key.startsWith("VUE_APP_") ||
			key.startsWith("VITE_") ||
			key.startsWith("ENV_") ||
			key === "GEO_LOCATION_API_KEY"
		) {
			processEnvDefines[`process.env.${key}`] = JSON.stringify(value ?? "");
		}
	}

	const port = Number(process.env.VUE_APP_FRONTEND_PORT || env.VUE_APP_FRONTEND_PORT || 8080);
	const host = process.env.VUE_APP_FRONTEND_HOST || env.VUE_APP_FRONTEND_HOST || "localhost";
	const protocol = process.env.VUE_APP_FRONTEND_PROTOCOL || env.VUE_APP_FRONTEND_PROTOCOL || "http";
	const appEnv = process.env.VUE_APP_ENV || env.VUE_APP_ENV || "local";
	const isProdMinify = process.env.NODE_ENV === "prod";

	const isBuildOrTest =
		process.argv.includes("build") || process.argv.some((arg) => arg.includes("vitest"));

	const serverHttps = (() => {
		if ( protocol !== "https" ) {
			return undefined;
		}
		const certPath = path.resolve(process.cwd(), "certificates", `${appEnv}-cert.pem`);
		const keyPath = path.resolve(process.cwd(), "certificates", `${appEnv}-key.pem`);
		const certsExist = existsSync(certPath) && existsSync(keyPath);
		if ( !certsExist ) {
			// Build/test do not need TLS files; serve still requires them when HTTPS is configured.
			if ( isBuildOrTest ) {
				return undefined;
			}
			throw new Error(`HTTPS is enabled but certificates were not found for env "${appEnv}".`);
		}
		// High-risk operation: reads local TLS certificate files from disk when HTTPS is enabled.
		return {
			cert: readFileSync(certPath),
			key: readFileSync(keyPath),
		};
	})();

	return {
		plugins: [vue()],
		envPrefix: ["VITE_", "VUE_APP_", "ENV_"],
		define: processEnvDefines,
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		server: {
			host: host,
			port: port,
			strictPort: true,
			allowedHosts: true,
			https: serverHttps,
			// Match the previous Vue CLI webSocketServer: false setting so deploy/WSS is not competing with HMR sockets.
			hmr: false,
		},
		preview: {
			host: host,
			port: port,
			https: serverHttps,
		},
		build: {
			sourcemap: isProdMinify ? false : true,
			// Match Vue CLI performance.hints: false so large vendor chunks do not fail the build.
			chunkSizeWarningLimit: 5000,
		},
		test: {
			environment: "jsdom",
			include: ["tests/**/*.{test,spec}.{js,ts}"],
			globals: false,
			clearMocks: true,
		},
	};
});
