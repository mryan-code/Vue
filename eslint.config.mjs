import pluginVue from "eslint-plugin-vue";
import { withVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

// ESLint 10 requires flat config; this preserves the previous .eslintrc.js rules.
export default withVueTs(
	pluginVue.configs["flat/essential"],
	vueTsConfigs.recommended,
	eslintPluginPrettierRecommended,
	{
		files: ["src/**/*.{js,ts,vue}"],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: "module",
			globals: {
				defineProps: "readonly",
				defineEmits: "readonly",
				defineExpose: "readonly",
				withDefaults: "readonly",
			},
		},
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-function": "off",
			"vue/multi-word-component-names": "off",
			// Keep lint at the previous Vue CLI rule set; eslint-plugin-vue 10 added these as errors.
			"vue/block-lang": "off",
			"vue/require-toggle-inside-transition": "off",
			"vue/require-v-for-key": "off",
			"vue/no-deprecated-filter": "off",
			"prefer-const": "off",
			"vue/max-len": [
				"error",
				{
					code: 120,
					template: 120,
					tabWidth: 2,
					ignoreUrls: true,
					ignoreStrings: true,
					ignoreTemplateLiterals: true,
					ignoreHTMLTextContents: true,
					ignoreHTMLAttributeValues: true,
				},
			],
		},
	},
);
