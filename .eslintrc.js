module.exports = {
	root: true,
	parser: "vue-eslint-parser",
	parserOptions: {
		parser: "@typescript-eslint/parser",
		ecmaVersion: 2022,
		sourceType: "module",
		extraFileExtensions: [".vue"],
	},
	plugins: ["vue", "@typescript-eslint"],
	extends: [
		"plugin:vue/vue3-essential",
		"eslint:recommended",
		"@vue/typescript/recommended",
		"plugin:prettier/recommended",
	],
	env: {
		node: true,
		browser: true,
		es6: true,
	},
	globals: {
		defineProps: "readonly",
		defineEmits: "readonly",
		defineExpose: "readonly",
		withDefaults: "readonly",
	},
	rules: {
		"no-unused-vars": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-empty-function": "off",
		"vue/multi-word-component-names": "off",
		"vue/max-len": [
			"error",
			{
				code: 120,
				template: 120, // Customize line length for templates
				tabWidth: 2,
				ignoreUrls: true,
				ignoreStrings: true,
				ignoreTemplateLiterals: true,
			},
		],
	},
};
