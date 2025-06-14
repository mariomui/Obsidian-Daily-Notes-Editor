// import { rename } from "node:fs/promises";

import { join, resolve as pathresolve } from "node:path";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import copyNewer from "copy-newer";
import { ensureFile, pathExists, move } from "fs-extra";
import autoPreprocess from "svelte-preprocess";
import type { ConfigEnv, Rollup, UserConfig } from "vite";
import { defineConfig } from "vite";
import type { PipeConstructor } from "./rollphidian";
import { Pipe } from "./rollphidian";

// const prod = process.argv[4] === "production";

function manuTerserPlugin(mode): Rollup.Plugin {
    if (mode === "development") {
        return {
            name: "no compression",
        };
    }
    return terser({
        compress: {
            defaults: false,
            drop_console: ["log", "info"],
        },
        mangle: {
            eval: true,
            module: true,
            toplevel: true,
            safari10: true,
            properties: false,
        },
        output: {
            comments: false,
            ecma: 2020,
        },
    });
}

function manuViteFig(configEnv: ConfigEnv): UserConfig {
    const { mode } = configEnv;
    const Piper = Pipe as unknown as PipeConstructor;

    const _userFig: UserConfig = {
        plugins: [
            svelte({
                preprocess: autoPreprocess(),
            }),
        ],
        build: {
            sourcemap: mode === "development" ? "inline" : false,
            minify: mode !== "development",
            // Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
            lib: {
                entry: new URL("./src/dailyNoteViewIndex.ts", import.meta.url)
                    .pathname,
                formats: ["cjs"],
            },
            rollupOptions: {
                plugins: [
                    manuTerserPlugin(mode),
                    resolve({
                        browser: false,
                    }),
                    replace({
                        preventAssignment: true,
                        "process.env.NODE_ENV": JSON.stringify(
                            process.env.NODE_ENV
                        ),
                    }),
                ],
                output: {
                    // Overwrite default Vite output fileName
                    entryFileNames: "main.js",
                    assetFileNames: "styles.css",
                },
                external: [
                    "obsidian",
                    "electron",
                    "@codemirror/autocomplete",
                    "@codemirror/collab",
                    "@codemirror/commands",
                    "@codemirror/language",
                    "@codemirror/lint",
                    "@codemirror/search",
                    "@codemirror/state",
                    "@codemirror/view",
                    "@lezer/common",
                    "@lezer/highlight",
                    "@lezer/lr",
                ],
            },
            // Use root as the output dir
            emptyOutDir: false,
            outDir: "dist",
        },
    };
    // Use this to interface with rollup plugins because the ophidian paradigm is easier to dev with
    if (mode === "development") {
        // development dist;
        const dist = "./dist";
        const { id } = require("./manifest.dev.json");

        let outDir = _userFig.build?.outDir || dist;
        if (process.env.OBSIDIAN_TEST_VAULT) {
            outDir = join(
                process.env.OBSIDIAN_TEST_VAULT,
                ".obsidian",
                "plugins",
                id
            );
        }

        new Piper(_userFig)
            .withRollupBuildPlugins([CopyManifestToDistPlugin(dist)])
            .withRollupBuildPlugins([
                AddHotReloadPlugin(outDir, true),
                MoveArtifactsUsingPlugin(dist, outDir),
                RenameFilePlugin(outDir, "manifest.dev.json", "manifest.json"),
                // last one here should not be sequential or else there's a waiting sequence
            ]);
    }
    return _userFig;
}

export default defineConfig(manuViteFig);

function RenameFilePlugin(location, oldname, new_name) {
    return {
        name: "plugin:renameFileAfterBuildFinale",
        closeBundle: {
            enforce: "post",
            // sequential: true,
            handler: async () => {
                const old_path = pathresolve(location, oldname);
                const new_path = pathresolve(location, new_name);

                // early escape if file doesn't exists;
                const isPathExists = await pathExists(old_path);
                if (!isPathExists) return;

                await move(old_path, new_path, { overwrite: true });
            },
        },
    };
}

/**
 * Creates a Rollup plugin that copies a manifest file to the specified distribution directory
 * at the end of the build process. The plugin uses the provided file pattern to locate the manifest
 * (defaulting to "manifest.dev.json") and copies it from the current working directory to the
 * destination directory (defaulting to "./dist") if the source file is newer.
 *
 * @param destDir - The destination directory where the manifest file should be copied. Defaults to "./dist".
 * @param pattern - The glob pattern or filename of the manifest to copy. Defaults to "manifest.dev.json".
 * @returns A Rollup plugin object that performs the copy operation at the end of the build.
 */
function CopyManifestToDistPlugin(
    destDir = "./dist",
    pattern = "manifest.dev.json"
): Rollup.Plugin {
    return {
        name: "plugin:copy-manifest-to-dist",
        closeBundle: {
            sequential: true,
            handler: async () => {
                await copyNewer(pattern, destDir, {
                    verbose: true,
                    cwd: ".", // grab manifest files from current root directory
                });
            },
        },
    };
}

/**
 * @typedoc
 * Creates a Rollup plugin that triggers a hot reload by creating a `.hotreload` file
 * in the specified destination directory when the build ends.
 *
 * @param destDir - The directory where the `.hotreload` file will be created.
 * @param isHotReload - Optional. If `true`, enables hot reload functionality. Defaults to `false`.
 * @returns A Rollup plugin object that handles hot reload signaling.
 */
function AddHotReloadPlugin(
    destDir: string,
    isHotReload: boolean = false
): Rollup.Plugin {
    return {
        name: "hotreload",
        closeBundle: {
            sequential: true,
            handler: async () => {
                if (isHotReload) {
                    await ensureFile(`${destDir}/.hotreload`);
                }
            },
        },
    };
}

/**
 * Creates a Rollup plugin that moves build artifacts from a source directory to a target directory after the bundle is closed.
 *
 * The plugin copies files matching the pattern `{main.js,styles.css,manifest.*.json}` from the specified `fromDir` to `toDir`.
 * It uses the `copyNewer` function to perform the copy operation, ensuring only newer files are copied.
 *
 * @param fromDir - The source directory containing the build artifacts to move.
 * @param toDir - The destination directory where the artifacts should be moved.
 * @returns A Rollup plugin object that performs the move operation during the `closeBundle` hook.
 */
function MoveArtifactsUsingPlugin(
    fromDir: string,
    toDir: string
): Rollup.Plugin {
    return {
        name: "plugin:move-artifacts",
        closeBundle: {
            order: "post",
            sequential: true,
            handler: async () => {
                const pattern = "{main.js,styles.css,manifest.*.json}";
                const copyNewerFig = {
                    // opts.cwd: string - Same as glob's. The current working directory in which to search. Defaults to process.cwd(). (Included here because you'll most likely need it.) aka this is where your dist file is located;
                    verbose: true,
                    cwd: fromDir,
                };
                await copyNewer(
                    // pattern: array|string - One or more glob patterns to select for the files to copy.
                    pattern,
                    // director to copy to
                    toDir,
                    copyNewerFig
                ).catch(console.log);
            },
        },
    };
}
