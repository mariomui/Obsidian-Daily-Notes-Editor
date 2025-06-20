import type { View, Workspace, WorkspaceSplit } from "obsidian";
import type { ScribeningNoteEditor } from "./scribening-leaf-view";

// export interface DailyNoteEditorParent {
//     hoverPopover: DailyNoteEditor | null;
//     containerEl?: HTMLElement;
//     view?: View;
//     dom?: HTMLElement;
// }

export interface ScribeningNoteEditorParent {
    hoverPopover: ScribeningNoteEditor | null;
    containerEl?: HTMLElement;
    view?: View;
    dom?: HTMLElement;
}
export type ConstructableWorkspaceSplit = new (
    ws: Workspace,
    dir: "horizontal" | "vertical"
) => WorkspaceSplit;

export const SV_NOTE_LEAF_COMPLEX_CSS_SELECTOR =
    ".dn-editor.dn-leaf-view .workspace-leaf";
