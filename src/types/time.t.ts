export type TimeRange =
    | "week"
    | "month"
    | "year"
    | "all"
    | "last-week"
    | "last-month"
    | "last-year"
    | "quarter"
    | "last-quarter"
    | "custom";

export type SelectionMode = "daily" | "folder" | "tag";

export type SortField = SortByValue;

export const SORT_BYS = {
    CTIME: "ctime",
    MTIME: "mtime",
    CTIME_REVERSE: "ctimeReverse",
    MTIME_REVERSE: "mtimeReverse",
    NAME: "name",
    NAME_REVERSE: "nameReverse",
} as const;

export type SortByConst = keyof typeof SORT_BYS;
export type SortByValue = (typeof SORT_BYS)[keyof typeof SORT_BYS];
