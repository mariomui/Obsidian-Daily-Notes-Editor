import type { Rollup, UserConfig, UserConfigFn } from "vite";


interface Pipe {
    userConfig: UserConfig;
    _apply: (userConfig: UserConfig) => Pipe;
    withRollupBuildPlugins: (plugins: Rollup.Plugin[]) => Pipe;
}

export function Pipe(this: Pipe, userConfig: UserConfig) {
    this.userConfig = userConfig;
}
export interface PipeConstructor {
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
    return this;
};

// # Utils
export function setNested(obj, crumbs, value, recurseOutValue = 10) {
    if (recurseOutValue < 1) {
        throw new Error("recursion over limit");
    }
    if (isPlainObject(obj) === false) {
        throw new Error("arguments are unsuitable");
    }
    const keys = crumbs.split(".");
    if (keys.length < 1) {
        console.error("No crumbs to traverse");
    }
    if (keys.length === 1) {
        obj[keys[0]] = value;
        return;
    }
    const key = keys[0];
    if (!obj.hasOwnProperty(key)) {
        obj[key] = {};
    }
    if (isPlainObject(obj[key])) {
        return setNested(
            obj[key],
            keys.slice(1).join("."),
            value,
            --recurseOutValue
        );
    }
    return null;
}
function isPlainObject(value) {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.prototype.toString.call(value) === "[object Object]"
    );
}
