import { ScribeningNoteEditor } from "@src/controllers/scribening-leaf-view";
import type { View, Workspace, WorkspaceSplit } from "obsidian";

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
export const popoverEltoSvNoteEditorMap = new WeakMap<
    Element,
    ScribeningNoteEditor
>();

export type FishoutSvNoteEditorFromFn = (
    win?: Window
) => ReturnType<typeof ScribeningNoteEditor.fishoutSvNoteEditorFrom>;

export type GetWindowsFromWorkspaceSplitFn = () => ReturnType<
    typeof ScribeningNoteEditor.getWindowsFromWorkspaceSplit
>;
export const LEAF_VIEW_CLZZ = ".dn-leaf-view";
