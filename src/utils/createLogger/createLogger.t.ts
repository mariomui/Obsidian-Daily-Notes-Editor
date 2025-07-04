import { BG_COLORS, COLORS } from "@src/utils/createLogger/COLORS.c";

// # KNOBS
export const CUSTOM_LEVEL_FLAGS = {
    INFO_ONCE: "info_once",
    INFO_ALL_ONCE: "info_all_once",
    TRACE_ONCE: "trace_once",
} as const;
export type CUSTOM_LEVEL_FLAGS_KEYS = keyof typeof CUSTOM_LEVEL_FLAGS;
export type CUSTOM_LEVEL_FLAGS_VALUES =
    | (typeof CUSTOM_LEVEL_FLAGS)[keyof typeof CUSTOM_LEVEL_FLAGS];

export const LEVEL_FLAGS = {
    FATAL: "fatal",
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
    TRACE: "trace",
    SILENT: "silent",
} as const;
export type LEVELS_FLAGS_KEYS = keyof typeof LEVEL_FLAGS;
export type LEVEL_FLAGS_VALUES =
    | (typeof LEVEL_FLAGS)[keyof typeof LEVEL_FLAGS]
    | string;

export const INFO_COLOR = COLORS.GREEN + BG_COLORS.BG_BLACK;
export const LEVEL_COLORS: Record<
    LEVELS_FLAGS_KEYS | CUSTOM_LEVEL_FLAGS_KEYS,
    string
> = {
    FATAL: COLORS.RED,
    ERROR: COLORS.RED,
    WARN: COLORS.YELLOW,
    INFO: INFO_COLOR,
    INFO_ONCE: INFO_COLOR,
    INFO_ALL_ONCE: INFO_COLOR,
    DEBUG: COLORS.GREEN,
    TRACE: COLORS.BLUE + BG_COLORS.BG_WHITE,
    TRACE_ONCE: COLORS.BLUE + BG_COLORS.BG_WHITE,
    SILENT: "",
} as const;
export type LEVEL_COLORS_KEYS = keyof typeof LEVEL_COLORS;

export type COLORS_KEYS = keyof typeof COLORS;

/***
 * Util inspect uses a object conditional to format the value of the object it iteratively walks through.
 * Strings are red, arrays are blue, etc, for example.
 * 🔗 [{function} cInspect] for details
 */
export const check_types = ["string", "array", "object", "unknown"] as const;
export type Check_types = (typeof check_types)[number];

export type LogObj = {
    group: string;
    level: string;
    msg: string;
    number: number;
    time: number; // UTC milliseconds
};
