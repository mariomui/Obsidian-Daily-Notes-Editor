import { checkIsObject } from "@src/utils";
import {
    type Check_types,
    check_types,
    type COLORS_KEYS,
} from "@src/utils/createLogger/createLogger.t";
import inspect from "util-inspect";
import { COLORS } from "./COLORS.c";

export function getTypeOf(val): Check_types {
    const checkChoices = {
        string: checkIsString,
        array: checkIsArray,
        object: checkIsObject,
    };
    for (const check_type of check_types) {
        const check = checkChoices[check_type];
        if ((typeof check === "function" && check(val)) === true) {
            return check_type;
        }
    }
    return "unknown";
}
function checkIsString(v) {
    return typeof v === "string";
}
function checkIsArray(v) {
    return Array.isArray(v);
}
export const make_traceable_codeclass_name = createApplyColorToWith(
    COLORS.BLUE
);

/**
 * apply color to a message (wraps it)
 * @param {string[]} messages
 * @param {string} template // uses positional variables for easy reordering of message args
 */
export function applyColorTo(messages: string[], template = "$1 $2"): string {
    const pugitted = pugit(messages, template);

    return pugitted;
}
/**
 * @param {any[]} subs
 * @param {template} string
 * @returns {string} // returns a string, acts like a poorman's pugit
 */
export function pugit(subs, template): string {
    // dynamically source the view partial so that the filename can be changed at will.
    let display_string = template;
    const tokens = template.match(/\$\d+/g);
    // console.log({ tokens, display_string, template, subs });
    for (const [idx, token] of Object.entries(tokens)) {
        display_string = display_string.replace(token, subs[Number(idx)]);
    }

    return display_string + " " + COLORS.RESET + "\x1b[49m";
}

/**
 * allows browser-level util inspect with color
 */
export function cInspect(message, fig = {}): string {
    const color_message = inspect(message, {
        color: true,
        depth: 2,
        stylize: function (text, type) {
            const color: COLORS_KEYS = inspect.styles?.[type] ?? "red";
            return applyColorTo([COLORS[color.toUpperCase()], text]);
        },
        // as much as I would like these to be supported they arent
        // compact: true,
        // breakLength: 10,
        // maxStringLength: 10,
        ...fig,
    });
    return color_message;
}

/**
 * factory function for apply Color with a default color
 * @param
 */
export function createApplyColorToWith(default_color) {
    return (message) => {
        return applyColorTo([default_color, message]);
    };
}
