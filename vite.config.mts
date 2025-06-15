// import { rename } from "node:fs/promises";

import { join, resolve as pathresolve } from "node:path";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import chalk from "chalk";
import copyNewer from "copy-newer";
import { ensureFile, pathExists, move } from "fs-extra";
import autoPreprocess from "svelte-preprocess";
import { ConfigEnv, Rollup, UserConfig } from "vite";
import { defineConfig } from "vite";
import type { PipeConstructor } from "./rollphidian.mts";
import { Pipe } from "./rollphidian.mts";
import { RollupLogger } from "./build-utils/RollupLogger.mts";
import builtins from "builtin-modules";

// const prod = process.argv[4] === "production";
const rollupLogger = new RollupLogger(chalk);
function manuViteFig(configEnv: ConfigEnv): UserConfig {
    // # CONSTS
    const { mode } = configEnv;
    const Piper = Pipe as unknown as PipeConstructor;

    // # KNOBS
    const dist = "dist";
    // ## FEATURE KNOBS
    const isPrototyping = true;
    const PROTOTYPE_ENTRYPOINT = "./src/main.ts";
    const ORIGINAL_ENTRYPOINT = "./src/dailyNoteViewIndex.ts";
    const entrypoint_path = isPrototyping
        ? PROTOTYPE_ENTRYPOINT
        : ORIGINAL_ENTRYPOINT;

    // # BUILD LOGIC
    const _userFig: UserConfig = {
        plugins: [
            svelte({
                preprocess: autoPreprocess(),
            }),
        ],
        resolve: {
            alias: [
                { find: "@src", replacement: join(__dirname, "src") },
                { find: "@utils", replacement: join(__dirname, "src/utils") },
            ],
        },
        build: {
            sourcemap: mode === "development" ? "inline" : false,
            minify: mode !== "development",
            // Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
            lib: {
                entry: new URL(entrypoint_path, import.meta.url).pathname,
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
                    ...builtins,
                ],
            },
            // Use root as the output dir
            emptyOutDir: false,
            outDir: dist,
        },
    };
    // Use this to interface with rollup plugins because the ophidian paradigm is easier to dev with
    if (mode === "development") {
        // grab the plugin name;
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
                RenameFilePlugin(outDir, "manifest.dev.json", "manifest.json", {
                    order: "post",
                }),
                // last one here should not be sequential or else there's a waiting sequence
            ]);
    }
    return _userFig;
}

export default defineConfig(manuViteFig);

// # ROLLUP PLUGINS

/**
 * Returns a Rollup plugin for code minification using Terser, or a no-op plugin in development mode.
 *
 * @param mode - The current build mode, typically "development" or "production".
 * @returns A Rollup plugin instance configured for the specified mode.
 */
function manuTerserPlugin(
    mode: string | "development" | "production"
): Rollup.Plugin {
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

type HookOptions<T = {}> = Omit<
    Extract<Rollup.ObjectHook<any>, { handler: any }>,
    "handler"
> &
    T;
/**
 * Vite plugin to rename a file after the build process completes.
 *
 * @param location - The directory containing the file to rename.
 * @param oldname - The current filename.
 * @param new_name - The new filename to rename to.
 * @returns A Vite plugin object that renames the specified file after the bundle is closed.
 */
function RenameFilePlugin(
    location,
    oldname,
    new_name,
    options: HookOptions<{ sequential?: boolean }>
): Rollup.Plugin {
    const plugin_name = RenameFilePlugin.name;
    const old_path = pathresolve(location, oldname);
    const new_path = pathresolve(location, new_name);

    const progressFig = rollupLogger.progress(
        `Renaming ${oldname} to ${new_name}`
    );
    const successFig = rollupLogger.success(`Renamed to: ${new_path} `);

    return {
        name: plugin_name,
        closeBundle: {
            // sequential: true,
            ...options,
            handler: async function () {
                // early escape if file doesn't exists;
                const isPathExists = await pathExists(old_path);

                if (!isPathExists) return;

                this.info(progressFig);

                await move(old_path, new_path, { overwrite: true }).catch(
                    (err) => this.warn(rollupLogger.fail(err))
                );

                this.info(successFig);
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
    const successFig = rollupLogger.success(
        `Files matching ${pattern} copied to ${destDir}`
    );
    return {
        name: "plugin:copy-manifest-to-dist",
        closeBundle: {
            sequential: true,
            handler: async function () {
                await copyNewer(pattern, destDir, {
                    verbose: true,
                    cwd: ".", // grab manifest files from current root directory
                });
                this.info(successFig);
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
    const progressFig = rollupLogger.progress(
        `Artifacts moving from ${fromDir} to ${toDir}`
    );
    const successFig = rollupLogger.success(
        `Artifacts Successfully moved from ${fromDir} to ${toDir}`
    );
    return {
        name: "plugin:move-artifacts",
        closeBundle: {
            order: "post",
            sequential: true,
            handler: async function () {
                const pattern = "{main.js,styles.css,manifest.*.json}";
                const copyNewerFig = {
                    // opts.cwd: string - Same as glob's. The current working directory in which to search. Defaults to process.cwd(). (Included here because you'll most likely need it.) aka this is where your dist file is located;
                    verbose: true,
                    cwd: fromDir,
                };
                this.info(progressFig);

                await copyNewer(
                    // pattern: array|string - One or more glob patterns to select for the files to copy.
                    pattern,
                    // director to copy to
                    toDir,
                    copyNewerFig
                ).catch(console.log);
                this.info(successFig);
            },
        },
    };
}
