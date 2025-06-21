import dayjs from "dayjs";
import pino, { type Logger } from "pino";
import {
    BG_COLORS,
    COLORS,
    LEVEL_COLORS,
    type LEVEL_COLORS_KEYS,
} from "./createLogger.t";

const baseLogger: Logger = pino({
    browser: {
        // asObject: true,
        write: handlePinoWrite,
        formatters: {
            level: (label, number) => {
                // label is info etc
                return {
                    level: label,
                    number,
                };
            },
        },
    },
    // timestamp: () => `time:${dayjs().format()}`,
});
function handlePinoWrite(logObj: Record<string, any>) {
    const { level, number, msg, group, time } = logObj;
    const levelUppercased: LEVEL_COLORS_KEYS = level.toUpperCase();

    const timeFormatted = dayjs(time, "HH:mm:ss.sss");
    // `HH:mm:ss.sss`

    const LEVEL_COLOR = LEVEL_COLORS[levelUppercased];
    const $$group = group || number;
    console.log.call(
        this,
        `${COLORS.YELLOW}[${timeFormatted}] ${LEVEL_COLOR}${levelUppercased} ${COLORS.CYAN}[${$$group}] ${COLORS.WHITE}${BG_COLORS.BG_BLACK}${msg} ${COLORS.RESET}`
    );
}

// https://github.com/pinojs/pino/issues/274#issuecomment-319716064

function createLogger(): Logger {
    // if (baseLogger) {
    return baseLogger.child({ group: "app" });
    // }
    // fallback
    // return (..._args: any[]): void => {
    //     if (_args !== null && typeof _args[0] === "object") {
    //         // Extract caller line: line 0 = Error, 1 = logger(), 2 = actual caller
    //         const err = new Error();
    //         const stack = err.stack?.split("\n") || [];
    //         const callerLine = stack[2]?.trim();
    //         // console.log.call(this, ++i, callerLine);

    //         return;
    //     }
    //     console.log.apply(this, _args);
    // };
}
export const logger = createLogger();

type LoggerFn = {
    (loggerFig: Record<string, any>): void;
    (...args: any[]): void;
};
