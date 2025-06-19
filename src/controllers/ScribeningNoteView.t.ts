import type { SELECTION_MODES } from "./ScribeningNoteView.c";

export type SelectionModeConst = keyof typeof SELECTION_MODES;
export type SelectionModeValue =
    (typeof SELECTION_MODES)[keyof typeof SELECTION_MODES];
