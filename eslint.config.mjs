import { defineConfig } from "eslint/config";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import _import from "eslint-plugin-import";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: fixupConfigRules(compat.extends(
        "eslint:recommended",
        "@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
    )),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        react: fixupPluginRules(react),
        "react-hooks": fixupPluginRules(reactHooks),
        import: fixupPluginRules(_import),
    },

    languageOptions: {
        parser: tsParser,
    },

    settings: {
        react: {
            version: "detect",
        },

        "import/resolver": {
            typescript: {},
        },
    },

    rules: {
        "react/react-in-jsx-scope": "off",
        "@typescript-eslint/no-unused-vars": "error",

        "import/order": ["error", {
            groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        }],
    },
}]);