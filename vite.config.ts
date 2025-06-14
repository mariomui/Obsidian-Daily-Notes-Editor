import path from 'node:path';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import copyNewer from 'copy-newer';
import autoPreprocess from 'svelte-preprocess';
import { defineConfig } from 'vite';
import type { ConfigEnv, Rollup, UserConfig } from 'vite';
import { Pipe  } from './rollphidian';
import type {PipeConstructor} from "./rollphidian";

// import { dirname, join } from "node:path";

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

    const _userFig:UserConfig = {
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
                entry: path.resolve(__dirname, "./src/dailyNoteViewIndex.ts"),
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
            emptyOutDir: true,
            outDir: "dist",
        },
    };
    // Use this to interface with rollup plugins because the ophidian paradigm is easier to dev with
    if (mode === "development") {
        const outDir = _userFig.build?.outDir || "./dist";
        new Piper(_userFig).withRollupBuildPlugins([CopyManifestToDistPip(outDir)])
    }
    return _userFig;
}


export default defineConfig(manuViteFig);


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
function CopyManifestToDistPip(destDir = "./dist", pattern = "manifest.dev.json"): Rollup.Plugin {
    return {
        name: "plugin:copy-manifest-to-dist",
        buildEnd: async () => {
            await copyNewer(pattern, destDir, {
                verbose: true,
                cwd: ".", // grab manifest files from current root directory
            });
        },
    };
}

/* 
// easy dev plugins
function AddHotReloadPlugin(isHotReload: boolean = false): Plugin {
	return {
		name: "hotreload",
		setup(build: PluginBuild) {
			build.onEnd(async () => {
				if (isHotReload)
					await ensureFile(
						dirname(build.initialOptions.outfile || ARTIFACTS_DIR) +
							"/.hotreload",
					);
			});
		},
	};
}
function MoveArtifactsUsingPlugins(ARTIFACTS_DIR: string): Plugin {
	return {
		name: "plugin:move-artifacts",
		setup(build: PluginBuild) {
			build.onEnd(genCopy);
			async function genCopy() {
				// if there is an outdir override the destination dir to copy to.
				// if there is a outfile, use that outfile to determine the destination directory
				const destDir =
					build.initialOptions.outdir ??
					dirname(build.initialOptions.outfile || ARTIFACTS_DIR);

				const pattern = "{main.js,styles.css,manifest.json}";
				const copyNewerFig = {
					// opts.cwd: string - Same as glob's. The current working directory in which to search. Defaults to process.cwd(). (Included here because you'll most likely need it.) aka this is where your dist file is located;
					verbose: true,
					cwd: ARTIFACTS_DIR,
				};
				await copyNewer(
					// pattern: array|string - One or more glob patterns to select for the files to copy.
					pattern,
					// director to copy to
					destDir,
					copyNewerFig,
				).catch(console.log);
			}
		},
	};
}
*/