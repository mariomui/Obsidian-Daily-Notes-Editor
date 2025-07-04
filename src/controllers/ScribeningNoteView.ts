// This view is registersed in the plugin. When we register a factory function, that function utilizes this viewcontroller to craft the instance
import ScribeningEditorView from "@src/component/ScribeningEditorView.svelte";
import {
    SCRIBENING_NOTE_VIEW_TYPE,
    SELECTION_MODES,
    type ScribeningNoteViewState,
    type SelectionModeValue,
    type SortBysValue,
} from "@src/controllers/ScribeningNoteView.t";
import ScribeningPlugin from "@src/main";
import type { SortField, TimeRange } from "@src/types/time.t";
import { getBasenameOfFolderPath } from "@src/utils";
import { createLoggerV2 } from "@src/utils/createLogger/createLogger";

import { make_traceable_codeclass_name } from "@src/utils/createLogger/createLogger.f";

import { DebugHelper } from "@src/utils/DebugHelper";
import {
    ItemView,
    Menu,
    Scope,
    type TAbstractFile,
    TFile,
    type WorkspaceLeaf,
} from "obsidian";

const logger = createLoggerV2();

export function isEmebeddedLeaf(leaf: WorkspaceLeaf) {
    // Work around missing enhance.js API by checking match condition instead of looking up parent
    return (leaf as any).containerEl.matches(".dn-leaf-view");
}

export class ScribeningNoteView extends ItemView {
    /**
     * The factory function supplying an instance of
     * ScribeningNoteView when a view is asked to be setViewState->revealLeaf.
     */
    svEditorView: ScribeningEditorView; // this is the svelte file
    plugin: ScribeningPlugin;
    scope: Scope; // For keyboard shortcuts

    selectedDaysRange: TimeRange = "all";
    selectionMode: SelectionModeValue = "folder";
    target: string = "";
    sortField: SortBysValue = "name";
    debugHelper = new DebugHelper();
    codeclass_name = this.constructor.name;

    constructor(leaf: WorkspaceLeaf, plugin: ScribeningPlugin) {
        super(leaf);
        this.plugin = plugin;

        this.scope = new Scope(plugin.app.scope);
        logger.trace(
            "leaf opens" + make_traceable_codeclass_name(this.codeclass_name)
        );
    }

    getMode = () => {
        return "source";
    };

    /**
     * INHERITED member function to retrieve the registered id
     * @return {SCRIBENING_NOTE_VIEW_TYPE} Registered Id storing the view manufacturer.
     */
    getViewType(): string {
        return SCRIBENING_NOTE_VIEW_TYPE;
    }

    /**
     * *INHERITED* member function that populates the tab title of the leaf.
     * "workspace-tab-header-inner-title"
     * In stacked tabs it it would be the vertical ui element that houses the filename
     * @returns {string} Tab Title
     */
    getDisplayText(): string {
        // https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines#Prefer+the+Vault+API+over+the+Adapter+API The tempation to use basename path parse is great. Don't do it.
        const folder_name = getBasenameOfFolderPath(
            this.app.vault,
            this.target
        );

        if (Boolean(folder_name) === false) {
            return this.target || "none";
        }
        // this.debugHelper.debug({ target: this.target });
        this.target = folder_name as string;
        // the first daily notes is used. There's not refresh of this.
        const choices: Partial<Record<SelectionModeValue, string>> = {
            [SELECTION_MODES.FOLDER]: `Folder: ${folder_name}`,
        };

        const selection_mode = this.selectionMode || "folder";
        return choices[selection_mode] || "Error";
    }

    getIcon(): string {
        const choices: Record<SelectionModeValue, string> = {
            [SELECTION_MODES.DAILY]: "calendar",
            [SELECTION_MODES.FOLDER]: `folder`,
            [SELECTION_MODES.TAG]: `tag`,
        };

        const selection_mode = this.selectionMode;
        return choices[selection_mode] || "document";
    }

    /**
     * @param {TAbstractFile} file
     */
    handleFileCreate = (file: TAbstractFile) => {
        console.log(
            "on open, this will be called whenever i create a new file"
        );
        // view is ScribeningEditorView
        if (file instanceof TFile) this.svEditorView.fileCreate(file);
    };

    handleFileDelete = (file: TAbstractFile) => {
        if (file instanceof TFile) this.svEditorView.fileDelete(file);
    };

    /**
     * @param {SelectionModeValue} mode to be deprecated (nxt-impl: "folder")
     * @param {string} target dirname
     */
    setSelectionMode(mode: SelectionModeValue, target: string = "") {
        logger.trace(
            "activated" +
                make_traceable_codeclass_name(
                    this.codeclass_name + " " + this.setSelectionMode.name
                )
        );
        this.selectionMode = mode;
        this.target = target;
        logger.trace({ target: this.target }, this.setSelectionMode.name);
        const svEditorView = this.svEditorView;
        // ScribeningEditorView
        if (svEditorView) {
            this.svEditorView.$set({
                selectionMode: mode,
                target: target,
            });
        }
    }

    saveCurrentSelectionAsPreset() {
        if (this.target) {
            // Check if this preset already exists
            const existingPresetIndex = this.plugin.settings.preset.findIndex(
                (p) => p.type === this.selectionMode && p.target === this.target
            );

            // If it doesn't exist, add it
            if (existingPresetIndex === -1) {
                this.plugin.settings.preset.push({
                    type: this.selectionMode,
                    target: this.target,
                });
                this.plugin.saveSettings();
            }
        }
    }

    getState(): ScribeningNoteViewState {
        const state: ScribeningNoteViewState = super.getState();

        return {
            ...state,
            selectionMode: this.selectionMode,
            target: this.target,
            sortField: this.sortField,
            selectedRange: this.selectedDaysRange,
        };
    }

    async setState(state: unknown, result?: any): Promise<void> {
        await super.setState(state, result);
        // Handle our custom state properties if they exist
        if (state && typeof state === "object" && !this.svEditorView) {
            const customState = state as {
                selectionMode?: SelectionModeValue;
                target?: string;
                sortField?: SortBysValue;
            };

            if (customState.selectionMode)
                this.selectionMode = customState.selectionMode;
            if (customState.target) this.target = customState.target;
            if (customState.sortField) this.sortField = customState.sortField;

            // This is the render function. The whole point is to pass the itemview's content el to the Svelte File so that it can mount it.
            this.svEditorView = new ScribeningEditorView({
                target: this.contentEl,
                props: {
                    plugin: this.plugin,
                    leaf: this.leaf,
                    selectionMode: this.selectionMode,
                    target: this.target,
                    sortField: this.sortField,
                },
            });
            // this.counter = mount(Counter, {
            //   target: this.contentEl,
            //   props: {
            //     startCount: 5,
            //   }
            // });

            this.app.workspace.onLayoutReady(this.svEditorView.tick.bind(this));

            // this.registerInterval(
            //     window.setInterval(async () => {
            //         this.view.check();
            //     }, 1000 * 60 * 60)
            // );
        }
    }

    /**
     * Sets the current sort field and updates the view with the new field.
     *
     * @param field - The field to sort by.
     */
    setSortField(field: SortField): void {
        this.sortField = field;
        if (this.svEditorView) {
            this.svEditorView.$set({ sortField: field });
        }
    }

    async onOpen(): Promise<void> {
        this.scope.register(["Mod"], "f", (e) => {
            // do-nothing
        });

        const LUCIDE_CLOCK = "clock";
        // https://docs.obsidian.md/Reference/TypeScript+API/ItemView/addAction
        this.addAction(LUCIDE_CLOCK, "Select Sort field", (e) => {
            const menu = new Menu();

            // Add time field selection options
            const addTimeFieldOption = (title: string, field: SortField) => {
                menu.addItem((item) => {
                    item.setTitle(title);
                    item.setChecked(this.sortField === field);
                    item.onClick(() => {
                        this.setSortField(field);
                    });
                });
            };

            addTimeFieldOption("Creation Time", "ctime");
            addTimeFieldOption("Modification Time", "mtime");
            addTimeFieldOption("Creation Time (Reverse)", "ctimeReverse");
            addTimeFieldOption("Modification Time (Reverse)", "mtimeReverse");
            // Add new options for sorting by name
            addTimeFieldOption("Name (A-Z)", "name");
            addTimeFieldOption("Name (Z-A)", "nameReverse");

            menu.showAtMouseEvent(e);
        });

        // Add action for selecting view mode
        // this.addAction("layers-2", "Select view mode", (e) => {
        //     const menu = new Menu();

        //     // Add mode selection options
        //     const addModeOption = (title: string, mode: SelectionModeValue) => {
        //         menu.addItem((item) => {
        //             item.setTitle(title);
        //             item.setChecked(
        //                 this.selectionMode === mode && !this.target
        //             );
        //             item.onClick(() => {
        //                 if (mode === "daily") {
        //                     this.setSelectionMode(mode);
        //                 } else {
        //                     // For folder and tag modes, we need to prompt for the target
        //                     const modal = new SelectTargetModal(
        //                         this.plugin.app,
        //                         mode,
        //                         (target: string) => {
        //                             this.setSelectionMode(mode, target);
        //                             // Save this selection as a preset
        //                             this.saveCurrentSelectionAsPreset();
        //                         }
        //                     );
        //                     modal.open();
        //                 }
        //             });
        //         });
        //     };

        // addModeOption("Daily Notes", "daily");
        // addModeOption("Folder", "folder");
        // addModeOption("Tag", "tag");

        // Add presets if they exist
        // if (this.plugin.settings.preset.length > 0) {
        //     menu.addSeparator();
        //     menu.addItem((item) => {
        //         item.setTitle("Saved Presets");
        //         item.setDisabled(true);
        //     });

        //     // Add each preset
        //     for (const preset of this.plugin.settings.preset) {
        //         const title =
        //             preset.type === "folder"
        //                 ? `Folder: ${preset.target}`
        //                 : `Tag: ${preset.target}`;

        //         menu.addItem((item) => {
        //             item.setTitle(title);
        //             item.setChecked(
        //                 this.selectionMode === preset.type &&
        //                     this.target === preset.target
        //             );
        //             item.onClick(() => {
        //                 this.setSelectionMode(preset.type, preset.target);
        //             });
        //         });
        //     }
        // }

        // menu.showAtMouseEvent(e);
        // });

        // Add "Save as Preset" button when in folder or tag mode
        // this.addAction("bookmark", "Save as preset", (e) => {
        //     // Only enable for folder and tag modes with a target
        //     if (this.selectionMode !== "daily" && this.target) {
        //         this.saveCurrentSelectionAsPreset();
        //         // Show a small notification
        //         new Notice("Preset saved");
        //     }
        // });

        // Add action for selecting time field (for folder and tag modes)

        // this.addAction("calendar-range", "Select date range", (e) => {
        //     const menu = new Menu();
        //     // Add range selection options
        //     const addRangeOption = (title: string, range: TimeRange) => {
        //         menu.addItem((item) => {
        //             item.setTitle(title);
        //             item.setChecked(this.selectedDaysRange === range);
        //             item.onClick(() => {
        //                 this.setSelectedRange(range);
        //             });
        //         });
        //     };

        //     addRangeOption("All Notes", "all");
        //     addRangeOption("This Week", "week");
        //     addRangeOption("This Month", "month");
        //     addRangeOption("This Year", "year");
        //     addRangeOption("Last Week", "last-week");
        //     addRangeOption("Last Month", "last-month");
        //     addRangeOption("Last Year", "last-year");
        //     addRangeOption("This Quarter", "quarter");
        //     addRangeOption("Last Quarter", "last-quarter");

        //     menu.addSeparator();
        //     menu.addItem((item) => {
        //         item.setTitle("Custom Date Range");
        //         item.setChecked(this.selectedDaysRange === "custom");
        //         item.onClick(() => {
        //             const modal = new CustomRangeModal(this.app, (range) => {
        //                 this.customRange = range;
        //                 this.setSelectedRange("custom");
        //             });
        //             modal.open();
        //         });
        //     });

        //     menu.showAtMouseEvent(e as MouseEvent);
        // });

        this.addAction("refresh", "Refresh", () => {
            if (this.svEditorView) {
                // Tell the Svelte component to check for daily notes
                this.svEditorView.check();

                // Update the view to get the latest files
                this.svEditorView.tick();

                // Force a refresh of the file list
            }
        });

        this.app.vault.on("create", this.handleFileCreate);
        this.app.vault.on("delete", this.handleFileDelete);
        this.leaf.togglePinned();
    }
}
