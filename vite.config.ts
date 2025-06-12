import path from "node:path";
import {
    BuildOptions,
    ConfigEnv,
    Rollup,
    UserConfig,
    UserConfigFn,
    UserConfigFnObject,
    defineConfig,
    mergeConfig,
} from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import autoPreprocess from "svelte-preprocess";
import terser from "@rollup/plugin-terser";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";

// const prod = process.argv[4] === "production";
interface Pipe {
    userConfig: UserConfig;
    _apply: (userConfig: UserConfig) => Pipe;
}

function Pipe(userConfig: UserConfig) {
    this.userConfig = userConfig;
}
interface PipeConstructor {
    new (fig: UserConfig): Pipe;
}
Pipe.prototype._apply = function _apply(userConfigFn: UserConfigFn): Pipe {
    userConfigFn(this.userConfig);
    return this;
};
Pipe.prototype.withRollupBuildPlugins = function withRollupBuildPlugins(
    plugins: Rollup.Plugin[]
) {
    this._apply((userConfig: UserConfig) => {
        if (!userConfig.build?.rollupOptions?.plugins) {
            setNested(userConfig, "build.rollupOptions.plugins", []);
        }
        if (Array.isArray(userConfig.build?.rollupOptions?.plugins)) {
            userConfig.build!.rollupOptions!.plugins!.push(...plugins);
        }
        return this;
    });
};

function wrapFigVite({ externalRollupPlugins }): UserConfigFnObject {
    // # external tools;
    const { manuCompressionPlugin } = externalRollupPlugins;

    return function (configEnv: ConfigEnv): UserConfig {
        const entry = path.resolve(__dirname, "./src/dailyNoteViewIndex.ts");

        const { mode } = configEnv;

        const plugins = [
            svelte({
                preprocess: autoPreprocess(),
            }),
        ];
        const buildFig: BuildOptions = {
            sourcemap: mode === "development" ? "inline" : false,
            minify: mode !== "development",
            // Use Vite lib mode https://vitejs.dev/guide/build.html#library-mode
            lib: {
                entry,
                formats: ["cjs"],
            },
            rollupOptions: {
                plugins: [
                    manuCompressionPlugin(mode),
                    resolve({
                        browser: false,
                    }),
                    replace({
                        preventAssignment: true,
                        "process.env.NODE_ENV": JSON.stringify(
                            process.env.NODE_ENV
                        ),
                    }),
                    ...externalRollupPlugins,
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
        };

        const userConfig = { plugins, build: buildFig };
        const fig = new Pipe(userConfig).withRollupBuildPlugins([
            manuCompressionPlugin(mode),
        ]);
        return fig.userConfig;
    };
}

const makeFig: UserConfigFnObject = wrapFigVite({
    externalRollupPlugins: { manuCompressionPlugin },
});
const viteFig = defineConfig(makeFig);

export default viteFig;

function manuCompressionPlugin(mode) {
    const terserFig = terser({
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
        ecma: 2020,
        output: {
            comments: false,
        },
    });
    if (mode === "development") {
        return terserFig;
    }
    return "";
}
function setupViteFig(externaPlugins, externalHelperFuncs) {
    return {
        // This is the default config for Vite, you can modify it as needed
        root: path.resolve(__dirname, "./src"),
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        server: {
            port: 3000,
            strictPort: true,
            open: true,
        },
        build: {
            outDir: path.resolve(__dirname, "./dist"),
            emptyOutDir: true,
        },
    };
}
function plugin1(): Rollup.Plugin {
    return {
        name: "plugin1",
        buildStart() {
            this.info({ message: "Hey", pluginCode: "SPECIAL_CODE" });
        },
    };
}
function setNested(obj, path, value) {
    const keys = path.split(".");
    let current = obj;

    keys.slice(0, -1).forEach((key) => {
        if (!(key in current)) current[key] = {};
        current = current[key];
    });

    current[keys[keys.length - 1]] = value;
}
