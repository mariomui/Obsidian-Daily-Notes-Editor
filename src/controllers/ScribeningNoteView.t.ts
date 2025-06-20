import type { SORT_BYS, SortField } from "@src/types/time.t";

export type SelectionModeConst = keyof typeof SELECTION_MODES;
export type SelectionModeValue =
    (typeof SELECTION_MODES)[keyof typeof SELECTION_MODES];

export const SELECTION_MODES = {
    DAILY: "daily",
    FOLDER: "folder",
    TAG: "tag",
} as const;

export const SCRIBENING_NOTE_VIEW_TYPE = "SCRIBENING-NOTE-VIEW";

export interface ScribeningNoteViewState extends Record<string, any> {
    selectionMode?: SelectionModeValue;
    target?: string;
    sortField?: SortField;
}
export type SortBysValue = (typeof SORT_BYS)[keyof typeof SORT_BYS];
