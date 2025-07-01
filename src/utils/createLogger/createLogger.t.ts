export const COLORS = {
    RESET: `\x1b[0m`,
    GREEN: `\x1b[32m`,
    RED: `\x1b[31m`,
    WHITE: `\x1b[37m`,
    YELLOW: `\x1b[33m`,
    CYAN: `\x1b[36m`,
    BLACK: `\x1b[30m`,
    BLUE: `\x1b[34m`,
    MAGENTA: `\x1b[35m`,
    BRIGHT_BLACK: `\x1b[90m`,
    BRIGHT_RED: `\x1b[91m`,
    BRIGHT_GREEN: `\x1b[92m`,
    BRIGHT_YELLOW: `\x1b[93m`,
    BRIGHT_BLUE: `\x1b[94m`,
    BRIGHT_MAGENTA: `\x1b[95m`,
    BRIGHT_CYAN: `\x1b[96m`,
    BRIGHT_WHITE: `\x1b[97m`,
} as const;
export type COLORS_KEYS = keyof typeof COLORS;

const STYLES = {
    BOLD: `\x1b[1m`,
    DIM: `\x1b[2m`,
    UNDERLINE: `\x1b[4m`,
    INVERSE: `\x1b[7m`,
    HIDDEN: `\x1b[8m`,
    STRIKETHROUGH: `\x1b[9m`,
};
export const BG_COLORS = {
    // Background colors
    BG_BLACK: `\x1b[40m`,
    BG_RED: `\x1b[41m`,
    BG_GREEN: `\x1b[42m`,
    BG_YELLOW: `\x1b[43m`,
    BG_BLUE: `\x1b[44m`,
    BG_MAGENTA: `\x1b[45m`,
    BG_CYAN: `\x1b[46m`,
    BG_WHITE: `\x1b[47m`,
};
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

export const LEVEL_COLORS: Record<LEVELS_FLAGS_KEYS, string> = {
    FATAL: COLORS.RED,
    ERROR: COLORS.RED,
    WARN: COLORS.YELLOW,
    INFO: COLORS.GREEN + BG_COLORS.BG_BLACK,
    DEBUG: COLORS.GREEN,
    TRACE: COLORS.BLUE + BG_COLORS.BG_WHITE,
    SILENT: "",
} as const;
export type LEVEL_COLORS_KEYS = keyof typeof LEVEL_COLORS;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type LEVEL_COLORS_VALUE = (typeof LEVEL_COLORS)[LEVEL_COLORS_KEYS];

export const check_types = ["string", "array", "object", "unknown"] as const;
export type Check_types = (typeof check_types)[number];

export type LogObj = {
    group: string;
    level: string;
    msg: string;
    number: number;
    time: number; // UTC milliseconds
};
