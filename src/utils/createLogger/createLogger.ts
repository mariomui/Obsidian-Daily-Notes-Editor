import {
    applyColorTo,
    cInspect,
    getTypeOf,
} from "@src/utils/createLogger/createLogger.f";
import {
    BG_COLORS,
    COLORS,
    LEVEL_COLORS,
    LEVEL_FLAGS,
    type LEVEL_COLORS_KEYS,
    type LEVEL_FLAGS_VALUES,
    type LogObj,
} from "@src/utils/createLogger/createLogger.t";
import dayjs from "dayjs";
import pino, { type Logger, type WriteFn } from "pino";
// # LOGIC

let trace_count = 0;

// https://github.com/pinojs/pino/pull/365/commits/3265354b36b4fd1e6f3b9c60a53ad80fcaf68e60
// globalSerializer doesn't work. conflicts when the write override function is used: undocumented.

/**
 * Always use baselogger for creating your loggers. It has all the standard defaults.
 */
const baseLogger: Logger = pino({
    level: LEVEL_FLAGS.TRACE,
    browser: {
        // serialize and transmit are too limited in scope. It is easier to transform the args into object form and feed into logger
        asObject: true,
        write: function (logObj: LogObj) {
            const { level } = logObj;

            const choices: Partial<Record<LEVEL_FLAGS_VALUES, () => unknown>> =
                {
                    [LEVEL_FLAGS.TRACE]: () =>
                        applyColorTo([
                            COLORS.BRIGHT_CYAN + BG_COLORS.BG_RED,
                            String(++trace_count),
                        ]),
                };
            const choice =
                choices[level] ||
                function () {
                    return "";
                };

            try {
                const console_message = [handlePinoWrite(logObj)]
                    .filter(Boolean)
                    .join(" ");
                if (console_message) {
                    console.log(console_message + " " + choice());
                }
            } catch (err) {
                console.warn({ err }, handlePinoWrite.name + " has erred");
            }
        } as WriteFn,
        formatters: {
            level: (level_flag: LEVEL_FLAGS_VALUES, level_code) => {
                return {
                    level: level_flag,
                    number: level_code,
                };
            },
        },
    },
    // timestamp: () => `time:${dayjs().format()}`,
});

const wrapLogMethod = createWrapLogMethod(baseLogger);

// # utils
/**
 * Converts the logObj msg into desired default message
 * @param {Record<string,any>} logObj
 * @param {([string, string]) => string} applyColorTo
 * @returns {string} a string that has the message with colors applied to it.
 */
function handlePinoWrite(
    logObj: Record<string, any>,
    fig = {
        applyColorTo,
    }
): string {
    // # toolsets
    const { applyColorTo } = fig;
    // # consts
    // msg or pkg or message may or may not appear.
    const {
        level,
        number: level_code,
        message,
        msg,
        // pkg,
        group,
        time,
    } = logObj;

    const uppercased_level_flag: LEVEL_COLORS_KEYS = level.toUpperCase();

    const formatted_time = dayjs(time, "HH:mm:ss.sss").toISOString();

    // Derived consts
    const level_color = LEVEL_COLORS[uppercased_level_flag];
    const $$group = group || level_code;

    const colored_timeformat = applyColorTo([COLORS.YELLOW, formatted_time]);
    const colored_level_flag = applyColorTo([
        level_color,
        uppercased_level_flag,
    ]);
    const colored_group = applyColorTo([COLORS.CYAN, $$group]);
    // console.log({ logObj });
    const combined_message = [msg, message].filter(Boolean).join("/");

    // do not apply color since there is a preprocessing effect earlier to apply color to message.
    const colored_message = combined_message
        ? applyColorTo([
              //   `${COLORS.WHITE}${BG_COLORS.BG_BLACK}`,
              "",
              combined_message,
          ])
        : "";
    // console.log({ colored_message });
    const result = [
        colored_timeformat,
        colored_level_flag,
        colored_group,
        colored_message,
        // pkg,
    ]
        .filter(Boolean)
        .join(" ");

    return result;
}

// # CREATORS

// ## wrap individual tracers

function createWrapLogMethod(_baseLogger) {
    return function wrapLogMethod(
        level,
        wrapLogMethodFig = {
            cInspectFig: {},
        }
    ) {
        const { cInspectFig } = wrapLogMethodFig;
        return (...args: any[]) => {
            const defaultStrategy = (v) =>
                applyColorTo([`${COLORS.WHITE} ${BG_COLORS.BG_BLACK}`, v]);
            const strategyChoices = {
                object: (val) => cInspect(val, cInspectFig),
                string: defaultStrategy,
                array: JSON.stringify,
            };
            const message = args
                .map((arg) => {
                    const type = getTypeOf(arg);
                    const formatted_msg_atom =
                        strategyChoices[type]?.(arg) || defaultStrategy(arg);
                    return formatted_msg_atom;
                })
                .join(" ");
            _baseLogger[level]({ level, message });
        };
    };
}

// ## WORKHORSE
// https://github.com/pinojs/pino/issues/274#issuecomment-319716064
function createLogger() {
    return {
        trace: wrapLogMethod("trace"),
        info: wrapLogMethod("info"),
    };
}

// ## V2 Wwhere I can create a child and supply it with options
type PinoBindings = {
    level: LEVEL_FLAGS_VALUES;
};
function manuCreateLoggerV2Fig() {
    return { bindings: { group: "app" }, childOptions: {} };
}
const idx = 0;
export function createLoggerV2(
    fig: {
        bindings?: Record<string, any>;
        childOptions?: Record<string, any>;
    } = manuCreateLoggerV2Fig()
) {
    const { bindings, childOptions } = { ...manuCreateLoggerV2Fig(), ...fig };
    const wrapLogMethod = createWrapLogMethod(
        baseLogger.child(bindings, childOptions)
    );
    const executedSet = new Set();
    const base = {
        trace: wrapLogMethod(LEVEL_FLAGS.TRACE),
        info: wrapLogMethod(LEVEL_FLAGS.INFO),
        infoWithFig: (...args) => {
            const fig = args.last();
            const rest = args.slice(0, args.length - 2);
            const fn = wrapLogMethod(LEVEL_FLAGS.INFO, fig);
            return fn(...rest);
        },
        infoAll: wrapLogMethod(LEVEL_FLAGS.INFO, {
            cInspectFig: {
                showHidden: true,
            },
        }),
        infoAllOnce: (...args) => {
            const func = wrapLogMethod(LEVEL_FLAGS.INFO, {
                cInspectFig: {
                    showHidden: true,
                },
            });
            onceIt({ func, message: "infoAllOnce" }, ...args);
        },
        traceOnce: (...args) => {
            const token = args.last();
            const rest = args.slice(0, args.length - 2);
            if (executedSet.has(token) === false) {
                executedSet.add(token);
                base.trace(...rest, "traceOnce");
            }
        },
        infoOnce: (...args) => {
            onceIt({ func: base.info, message: "infoOnce" }, ...args);
        },
    };
    function onceIt(fig, ...args) {
        const { func, message } = fig;
        const token = args.last();
        const rest = args.slice(0, args.length - 2);
        if (executedSet.has(token) === false) {
            executedSet.add(token);
            func(...rest, message);
        }
    }
    return base;
}

export function getRandomIntToken(max = 1000) {
    return Math.floor(Math.random() * max);
}
export const logger = createLogger(); // instance and share.
export const globalLogger = createLoggerV2();
