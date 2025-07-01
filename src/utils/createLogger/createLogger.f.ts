import {
    type Check_types,
    check_types,
    COLORS,
    type COLORS_KEYS,
} from "@src/utils/createLogger/createLogger.t";
import inspect from "util-inspect";

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
export function applyColorTo(messages: string[], template = "$1 $2"): string {
    const pugitted = pugit(messages, template);
    // console.log("pugitted:" + pugitted);
    return pugitted;
}
export function createApplyColorToWith(default_color) {
    return (message) => {
        return applyColorTo([default_color, message]);
    };
}
export function pugit(subs, template) {
    // dynamically source the view partial so that the filename can be changed at will.
    let display_string = template;
    const tokens = template.match(/\$\d+/g);
    // console.log({ tokens, display_string, template, subs });
    for (const [idx, token] of Object.entries(tokens)) {
        display_string = display_string.replace(token, subs[Number(idx)]);
    }

    return display_string + " " + COLORS.RESET + "\x1b[49m";
}
export function cInspect(message): string {
    const color_message = inspect(message, {
        color: true,
        depth: 2,
        stylize: function (text, type) {
            const color: COLORS_KEYS = inspect.styles?.[type] ?? "red";

            return applyColorTo([COLORS[color.toUpperCase()], text]);
        },
    });
    return color_message;
}
export function checkIsObject(value): boolean {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
