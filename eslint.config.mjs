// import { defineConfig, globalIgnores } from "eslint";
const require = createRequire(import.meta.url);
const { defineConfig, globalIgnores } = require("eslint/config");
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import parser from "svelte-eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js/src/index.js";
import { FlatCompat } from "@eslint/eslintrc";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores(["**/npm node_modules", "**/build", "**/*.d.ts"]),
    {
        files: ["**/*.ts"],
        extends: compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            // "plugin:@typescript-eslint/recommended" // getscope api error, <-- something in here isn't updated
            "plugin:svelte/recommended" // <--inner decorations error
        ),

        plugins: {
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
            quotes: [
                "error",
                "double",
                {
                    avoidEscape: true,
                    allowTemplateLiterals: true,
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
