// import { createUpDownNavigationExtension } from "@src/lib/UpAndDownNavigate";
import {
    ScribeningNoteView,
    SCRIBENING_NOTE_VIEW_TYPE,
} from "@src/controllers/ScribeningNoteView";

import type { TimeField } from "@src/types/time";
import { around } from "monkey-around";
import {
    type OpenViewState,
    Plugin,
    requireApiVersion,
    TFile,
    TFolder,
    Workspace,
    WorkspaceContainer,
    type WorkspaceItem,
    WorkspaceLeaf,
} from "obsidian";

// import { DAILY_NOTE_VIEW_TYPE, DailyNoteView } from "./dailyNoteView";

import "@src/style/index.css";
import {
    ScribeningNoteEditor,
    checkIsScribeningNoteLeaf,
} from "./controllers/scribening-leaf-view";
// import { setActiveEditorExt } from "./component/SetActiveEditor";
// import { addIconList } from "./utils/icon";

export default class Scribening extends Plugin {
    private view: ScribeningNoteView; // this is always populated with a ScribeningNoteView.
    lastActiveFile: TFile;
    // private lastCheckedDay: string;

    settings: {
        hideFrontmatter: boolean;
        hideBacklinks: boolean;
        createAndOpenOnStartup: boolean;
        useArrowUpOrDownToNavigate: boolean;
        preset: any[];
    };

    async onload() {
        // load data into data.json
        await this.loadSettings();

        this.patchWorkspace();
        this.patchWorkspaceLeaf();

        // addIconList();
        // this.lastCheckedDay = (moment as any)().format("YYYY-MM-DD");

        // Register the up and down navigation extension
        // this.settings.useArrowUpOrDownToNavigate &&
        //     this.registerEditorExtension([
        //         createUpDownNavigationExtension({
        //             app: this.app,
        //             plugin: this,
        //         }),
        //         // setActiveEditorExt({ app: this.app, plugin: this }),
        //     ]);

        // Register Factory Function so That Obsidian can use it to create future instances
        this.registerView(
            SCRIBENING_NOTE_VIEW_TYPE,
            (leaf: WorkspaceLeaf) =>
                (this.view = new ScribeningNoteView(leaf, this))
        );

        this.addCommand({
            id: "open-daily-note-editor",
            name: "Open Daily Note Editor",
            callback: () => this.openScriveningNoteEditor(),
        });

        this.initCssRules();

        // Create daily note and open the Daily Notes Editor on startup if enabled
        // if (this.settings.createAndOpenOnStartup) {
        //     this.app.workspace.onLayoutReady(async () => {
        //         // First ensure today's daily note exists
        //         await this.ensureTodaysDailyNoteExists();
        //         if (
        //             this.app.workspace.getLeavesOfType(SCRIBENING_NOTE_VIEW_TYPE)
        //                 .length > 0
        //         )
        //             return;
        //         // Then open the Daily Notes Editor
        //         await this.openDailyNoteEditor();
        //     });
        // }

        // Also check periodically (every 15 minutes) for day changes
        // this.registerInterval(
        //     window.setInterval(this.checkDayChange.bind(this), 1000 * 60 * 15)
        // );

        this.app.workspace.on("file-menu", (menu, file, source, leaf) => {
            const toRemoves: any[] = [];
            if (file instanceof TFolder) {
                // item must be remembered so that the onClick can be rewritten.
                // This is especially on Hotreload to avoid multiple menuItems being set.
                for (const item of menu.items) {
                    const isItemPreviouslyCreated =
                        item.dom.getAttribute("data-open-daily-note") ===
                        "true";
                    if (isItemPreviouslyCreated) {
                        toRemoves.push(item);
                    }
                }
                if (toRemoves.length === 0) {
                    menu.addItem((item) => {
                        item.setIcon("briefcase");
                        item.setTitle("Open Scribening View");
                        item.onClick(() => {
                            this.openFolderView(file.path);
                        });
                        item.dom.setAttribute("data-open-daily-note", "true");
                    });
                }
                for (const menuItem of toRemoves) {
                    menuItem.onClick(() => {
                        menuItem.setIcon("briefcase");
                        menuItem.setTitle("Open Scribening View");
                        this.openFolderView(file.path);
                    });
                }
            }
        });
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(SCRIBENING_NOTE_VIEW_TYPE);

        // document.body.toggleClass("daily-notes-hide-frontmatter", false);
        // document.body.toggleClass("daily-notes-hide-backlinks", false);
    }

    async openScriveningNoteEditor() {
        const workspace = this.app.workspace;
        const leaf = workspace.getLeaf(true);
        await leaf.setViewState({ type: SCRIBENING_NOTE_VIEW_TYPE });
        workspace.revealLeaf(leaf);
    }

    async openFolderView(folderPath: string, timeField: TimeField = "mtime") {
        const workspace = this.app.workspace;
        // create new leaf
        // ? Why is this leaf Scribening Note after the fact?
        const leaf = workspace.getLeaf(true);
        // this leaf automatically becomes a SCRIBENING NOTE VIEW LEAF

        await leaf.setViewState({ type: SCRIBENING_NOTE_VIEW_TYPE });

        // this.app.workspace.getActiveViewOfType(
        //     MarkdownView as unknown as new (...args: any[]) => View
        // );

        // Toggle the auto reveal off when i open up a folderview
        const fileExplorerView = workspace
            ?.getLeavesOfType("file-explorer")
            .at(0)?.view;
        if (fileExplorerView) {
            const prevViewState = fileExplorerView.getState();
            const prevAutoRevealState = prevViewState.autoReveal;
            fileExplorerView["setAutoReveal"](false);

            // TODO save the original state of autoreveal to revert it back when view.onClose
            // fileExplorerView["onToggleAutoReveal"]();
        }

        // Get the view and set the selection mode to folder
        // prep the view;
        const view = leaf.view as ScribeningNoteView;
        view.setSelectionMode("folder", folderPath);
        view.setTimeField(timeField);
        workspace.revealLeaf(leaf);
    }

    // async openTagView(tagName: string, timeField: TimeField = "mtime") {
    //     const workspace = this.app.workspace;
    //     const leaf = workspace.getLeaf(true);
    //     await leaf.setViewState({ type: SCRIBENING_NOTE_VIEW_TYPE });

    //     // Get the view and set the selection mode to tag
    //     const view = leaf.view as ScribeningNoteView;
    //     view.setSelectionMode("tag", tagName);
    //     view.setTimeField(timeField);

    //     workspace.revealLeaf(leaf);
    // }

    // async ensureTodaysDailyNoteExists() {
    //     try {
    //         const currentDate = (moment as any)();
    //         const allDailyNotes = getAllDailyNotes();
    //         const currentDailyNote = getDailyNote(currentDate, allDailyNotes);

    //         if (!currentDailyNote) {
    //             await createDailyNote(currentDate);
    //         }
    //     } catch (error) {
    //         console.error("Failed to create daily note:", error);
    //     }
    // }

    initCssRules() {
        document.body.toggleClass(
            "daily-notes-hide-frontmatter",
            this.settings.hideFrontmatter
        );
        document.body.toggleClass(
            "daily-notes-hide-backlinks",
            this.settings.hideBacklinks
        );
    }

    patchWorkspace() {
        let layoutChanging = false;
        const uninstaller = around(Workspace.prototype, {
            // somemethod: function somemethod(oldmethod)  { ... }
            // getActiveViewOfType: (oldmethod) =>
            //     function (func: any) {
            //         //
            //         const viewInstance = oldmethod.call(this, func);
            //         // postprocess when the viewInstance is non existent
            //         if (!viewInstance && func?.VIEW_TYPE === "markdown") {
            //             // the current workspace , the current leaf, aka container that houses a view.
            //             const activeLeaf = this.activeLeaf;

            //             // if the container, the view inside is my registered viewtype do nothing.
            //             if (activeLeaf?.view instanceof ScribeningNoteView) {
            //                 // const editMode = activeLeaf.view.editMode;
            //                 // editMode is a self appointed property pegged to the activeLeaf.
            //                 return activeLeaf.view["editMode"];
            //             }
            //             return viewInstance;
            //         }

            //         return viewInstance;
            //     },
            // Toggle isLayoutChangeInProgress when Workspace changes layouts
            changeLayout(old) {
                return async function (workspace: unknown) {
                    layoutChanging = true;
                    // changeLayout(workspace: any): Promise<void>;

                    try {
                        // Don't consider hover popovers part of the workspace while it's changing
                        await old.call(this, workspace);
                    } finally {
                        layoutChanging = false;
                    }
                };
            },
            iterateLeaves(old): Workspace["iterateLeaves"] {
                //iterateLeaves is a recursive function that returns a boolean
                //iterateLeaves is called by all the iterate* functions
                // getLeavesOfType searches for a specific viewtype
                type leafIterator = (item: WorkspaceLeaf) => boolean | void;
                return function (arg1, arg2) {
                    // Fast exit if desired leaf found
                    if (old.call(this, arg1, arg2)) return true;

                    // Handle old/new API parameter swap
                    // # Handle old/new API parameter swap
                    // ## workspace.getLeavesByType uses the arity1 signature.
                    const checkIsArgAFunction = (arg) =>
                        typeof arg === "function";

                    const cb: leafIterator = (
                        checkIsArgAFunction(arg1) ? arg1 : arg2
                    ) as leafIterator;
                    // ## if arg1 a function, then the parent is arg2 (aka undefined)
                    // ## if arg1 is an object then the parent is arg1 (aka parent of the container type object)
                    const parent: WorkspaceItem = (
                        checkIsArgAFunction(arg1) ? arg2 : arg1
                    ) as WorkspaceItem;

                    // iterateAllLeaves and iterateRootLeaves call iterateLeaves with an object in the first parameter. the arg1/parent then has a value.

                    // ## dont run postprocesses when:
                    // ### on startup,
                    // #### because parent is null
                    // ### getLeavesByType is called.
                    // ### layout is changing
                    if (!parent) return false;
                    if (layoutChanging) return false; // Don't let HEs close during workspace change

                    // ## arg1 Exists, ar2 Exists -> continue
                    // ## arg1 is not a function, and arg 2 is not a function -> continue

                    // 0.14.x doesn't have WorkspaceContainer; this can just be an instanceof check once 15.x is mandatory:
                    const isApiHigherOrEqualToPatch15 =
                        requireApiVersion("0.15.0");
                    if (isApiHigherOrEqualToPatch15 === false) {
                        if (
                            parent === this.app.workspace.rootSplit ||
                            (WorkspaceContainer &&
                                parent instanceof WorkspaceContainer)
                        ) {
                            for (const popover of ScribeningNoteEditor.popoversForWindow(
                                (parent as WorkspaceContainer).win
                            )) {
                                // Use old API here for compat w/0.14.x
                                if (
                                    old.call(
                                        this,
                                        cb as any,
                                        popover.rootSplit as any
                                    )
                                ) {
                                    // if api is cold, call iterateLeaves with cb as the first argument, and parent.rootsplit as the 2nd argument. Too much research to understand why.
                                    return true;
                                }
                            }
                        }
                    }
                    // For some reason when the leaves are all being iterated, don't return a boolean.
                    return false;
                };
            },
            // setActiveLeaf: (next: any) =>
            //     function (leafOrView: WorkspaceLeaf, t?: any) {
            //         console.log({ t });
            //         if (leafOrView.parentLeaf) {
            //             // active Time is an uncontrolled custom data pegged to a foreign body.
            //             leafOrView.parentLeaf["activeTime"] = 1700000000000;

            //             next.call(this, leafOrView.parentLeaf, t);
            //             // post process if there is a parent leaf.
            //             if (leafOrView.view["editMode"]) {
            //                 this.activeEditor = leafOrView.view;
            //                 leafOrView.parentLeaf.view.setMode["editMode"] =
            //                     leafOrView.view;
            //             }
            //             return;
            //         }
            //         return next.call(this, leafOrView, t);
            //     },
        });
        this.register(uninstaller);
    }

    // Used for patch workspaceleaf pinned behaviors
    patchWorkspaceLeaf() {
        this.register(
            around(WorkspaceLeaf.prototype, {
                // getRoot(old) {
                //     return function () {
                //         const top = old.call(this);
                //         // when is the workspaceitem's getRoot property equal to the leaf's item?
                //         if (top.getRoot === this.getRoot) {
                //             console.log("Im equal");
                //         }
                //         return top?.getRoot === this.getRoot
                //             ? top
                //             : top?.getRoot();
                //     };
                // },
                setPinned(old) {
                    // report to the plugin when the Leaf pins itself
                    return function (pinned: boolean) {
                        old.call(this, pinned);
                        if (checkIsScribeningNoteLeaf(this) && !pinned)
                            this.setPinned(true);
                    };
                },
                openFile(old) {
                    return function (file: TFile, openState?: OpenViewState) {
                        const isRecentFilesPluginEnabled =
                            this.app.plugins.enabledPlugins.has(
                                "recent-files-obsidian"
                            );
                        // open file happens on any file when you click on the title.
                        // This code removes QuickSwitcher from recording you if you click on any note that is a scribening note leaf
                        if (checkIsScribeningNoteLeaf(this)) {
                            setTimeout(
                                around(Workspace.prototype, {
                                    recordMostRecentOpenedFile(old) {
                                        return function (_file: TFile) {
                                            // if the recorded file is the same as the file , don't record into quickswitcher (native0)
                                            if (_file !== file) {
                                                return old.call(this, _file);
                                            }
                                        };
                                    },
                                }),
                                1 // this uninstalls after setTimeout ends
                            );
                            if (isRecentFilesPluginEnabled)
                                setTimeout(
                                    around(isRecentFilesPluginEnabled, {
                                        shouldAddFile(old) {
                                            return function (_file: TFile) {
                                                // don't let recent files record
                                                return (
                                                    _file !== file &&
                                                    old.call(this, _file)
                                                );
                                            };
                                        },
                                    }),
                                    1
                                );
                        }
                        return old.call(this, file, openState);
                    };
                },
            })
        );
    }

    public async loadSettings() {
        this.settings = Object.assign(
            {},
            {
                hideFrontmatter: true,
                hideBacklinks: true,
                createAndOpenOnStartup: false,
                useArrowUpOrDownToNavigate: false,
                preset: [],
            },
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    // private async checkDayChange(): Promise<void> {
    //     const currentDay = (moment as any)().format("YYYY-MM-DD");

    //     if (currentDay !== this.lastCheckedDay) {
    //         this.lastCheckedDay = currentDay;
    //         console.log("Day changed, updating daily notes view");

    //         await this.ensureTodaysDailyNoteExists();

    //         const dailyNoteLeaves = this.app.workspace.getLeavesOfType(
    //             SCRIBENING_NOTE_VIEW_TYPE
    //         );
    //         if (dailyNoteLeaves.length > 0) {
    //             for (const leaf of dailyNoteLeaves) {
    //                 const view = leaf.view as ScribeningNoteView;
    //                 if (view) {
    //                     view.refreshForNewDay();
    //                 }
    //             }
    //         }
    //     }
    // }
}
