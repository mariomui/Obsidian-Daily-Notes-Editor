// import { defineConfig, globalIgnores } from "eslint";
const require = createRequire(import.meta.url);
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js/src/index.js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importEslint from 'eslint-plugin-import';
import globals from 'globals';
import parser from 'svelte-eslint-parser';
// import importQuotesRule from "./eslint-plugins/eslint-import-quotes/import-quotes.mjs";

const { defineConfig, globalIgnores } = require("eslint/config");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores([
        "**/npm node_modules",
        "**/build",
        "**/*.d.ts",
        "**/*.test.ts",
        "eslint.config.mjs",
    ]),
    {
        files: ["**/*.mjs", "**/*.ts"],
        extends: compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            // "plugin:@typescript-eslint/recommended" // getscope api error, <-- something in here isn't updated
            "plugin:svelte/recommended" // <--inner decorations error
        ),

        plugins: {
            // "import-quotes": importQuotesRule,
            "eslint-import-plugin": importEslint,
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },

            parser: tsParser,
            ecmaVersion: 8,
            sourceType: "module",

            parserOptions: {
                parser: "@typescript-eslint/parser",
            },
        },
        rules: {
            "no-unused-vars": "off",
            "no-undef": "warn",
            // quotes: [
            //     "warn",
            //     "double",
            //     {
            //         avoidEscape: true,
            //         allowTemplateLiterals: true,
            //     },
            // ],
            // "import-quotes/import-quotes": ["warn", "single"],
            "eslint-import-plugin/newline-after-import": ["warn", { count: 2 }],
            "eslint-import-plugin/order": [
                "warn",
                {
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                },
            ],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "none",
                },
            ],

            "@typescript-eslint/no-explicit-any": "off",
            "prefer-const": "warn",
            "@typescript-eslint/ban-ts-comment": "off",
            "no-prototype-builtins": "off",
            "@typescript-eslint/no-empty-function": "off",
        },
    },
    {
        files: ["**/*.svelte"],
        languageOptions: {
            parser: parser,
            globals: {
                ...globals.node,
                ...globals.browser,
            },
            parserOptions: {
                parser: tsParser,
                project: "./tsconfig.json",
                extraFileExtensions: [".svelte"],
            },
        },
    },
]);
