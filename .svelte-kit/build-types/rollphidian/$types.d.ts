import type { Rollup } from "vite";

export type HookOptions<T = {}> = Omit<
    Extract<Rollup.ObjectHook<any>, { handler: any }>,
    "handler"
> &
    T;
