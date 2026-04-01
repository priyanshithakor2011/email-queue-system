import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default [
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            import: importPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...tsPlugin.configs["recommended"].rules,
            ...prettierConfig.rules,

            "prettier/prettier": "error",

            "@typescript-eslint/explicit-function-return-type": "warn",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/consistent-type-imports": [
                "error",
                { prefer: "type-imports" },
            ],

            "import/order": [
                "error",
                {
                    groups: [
                        "builtin", "external",
                        "internal", "parent",
                        "sibling", "index",
                    ],
                    "newlines-between": "always",
                    alphabetize: { order: "asc" },
                },
            ],
            "import/no-duplicates": "error",
            "no-console": "warn",
        },
    },
    {
        ignores: ["dist/**", "node_modules/**", "*.js"],
    },
];