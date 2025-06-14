import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        silent: false,
        exclude: [
            "node_modules",
            "dist",
            ".idea",
            ".git",
            ".cache",
            "coverage",
            "build",
            "**/node_modules/**",
            "**/dist/**",
            "**/coverage/**",
            "**/.{idea,git,cache}/**",
        ],
    },
});
