const { ESLint } = require("eslint");

module.exports = [
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  {
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        project: "tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint/eslint-plugin": require("@typescript-eslint/eslint-plugin"),
    },
    rules: {
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
