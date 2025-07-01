import {
    checkIsScribeningNoteLeaf,
    ScribeningNoteEditor,
} from "@src/controllers/scribening-leaf-view";
import type { ScribeningNoteView } from "@src/controllers/ScribeningNoteView";
import {
    SCRIBENING_NOTE_VIEW_TYPE,
    type ScribeningNoteViewState,
} from "@src/controllers/ScribeningNoteView.t";
import { ScribeningSettingTab } from "@src/controllers/ScribeningSettings";
import {
    every250WordsPlugin,
    fileNameField,
    pluginField,
    wordField,
} from "@src/lib/codemirror-addons";
import {
    MENU_ITEM_DATA_ATTRIBUTE,
    RECENT_FILES_PLUGIN_NAME,
} from "@src/main.t";
import { SORT_BYS, type SortField } from "@src/types/time.t";
import { logger } from "@src/utils/createLogger";
import { around } from "monkey-around";
import {
    Plugin,
    requireApiVersion,
    TFile,
    TFolder,
    Workspace,
    WorkspaceContainer,
    WorkspaceLeaf,
    type OpenViewState,
    type WorkspaceItem,
} from "obsidian";

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

    experimentWithCM() {
        this.registerEditorExtension([
            pluginField.init(() => this),
            every250WordsPlugin,
            fileNameField,
            wordField,
        ]);
    }
    async onload() {
        // load data into data.json
        await this.loadSettings();
        this.addSettingTab(new ScribeningSettingTab(this.app, this));

        this.experimentWithCM();

        this.initWorkspacePatch();
        this.initWorkspaceLeafPatch();

        // Register Factory Function so That Obsidian can use it to create future instances
        this.registerView(
            SCRIBENING_NOTE_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new ScribeningNoteView(leaf, this)
        );

        const SV_OPEN_CMD_LABEL = "Open Daily Note Editor";
        const SV_OPEN_CMD_ID = "open-daily-note-editor";
        this.addCommand({
            id: SV_OPEN_CMD_ID,
            name: SV_OPEN_CMD_LABEL,
            callback: () => this.openScriveningNoteEditor(),
        });

        this.initCssRules();

        this.hydrateFolderContextMenu();

        if (__MODE__ === "development" && __SCRIBENING_REL_TEST_FOLDER__) {
            setTimeout(() => {
                logger.level = "trace";
                logger.trace("open notes inside folder");
                this.openFolderView(
                    __SCRIBENING_REL_TEST_FOLDER__,
                    SORT_BYS.NAME
                );
            });
        }
    }

    hydrateFolderContextMenu(): void {
        this.app.workspace.on("file-menu", (menu, file) => {
            const toRemoves: any[] = [];
            if (file instanceof TFolder) {
                // item must be remembered so that the onClick can be rewritten.
                // This is especially on Hotreload to avoid multiple menuItems being set.
                for (const item of menu.items) {
                    const isItemPreviouslyCreated = item.dom.hasAttribute(
                        MENU_ITEM_DATA_ATTRIBUTE
                    );
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
                        item.dom.setAttribute(MENU_ITEM_DATA_ATTRIBUTE, "");
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

        return;
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

    async openFolderView(
        folderPath: string,
        sortField: SortField = SORT_BYS.NAME
    ) {
        const workspace = this.app.workspace;
        // create new leaf
        const leaf = workspace.getLeaf(true);

        await leaf.setViewState({ type: SCRIBENING_NOTE_VIEW_TYPE });
        const viewState = leaf.getViewState();
        viewState.state = { ...viewState.state, ...{ target: folderPath } };
        leaf.setViewState(viewState);
        logger.trace(leaf.getViewState(), leaf.getDisplayText());
        // this.app.workspace.getActiveViewOfType(
        //     MarkdownView as unknown as new (...args: any[]) => View
        // );
        // Toggle the auto reveal off when i open up a folderview
        const fileExplorerView = workspace
            ?.getLeavesOfType("file-explorer")
            .at(0)?.view;
        if (fileExplorerView) {
            // const prevViewState = fileExplorerView.getState();
            // const prevAutoRevealState = prevViewState.autoReveal;
            fileExplorerView["setAutoReveal"](false);

            // TODO save the original state of autoreveal to revert it back when view.onClose
            // fileExplorerView["onToggleAutoReveal"]();
        }

        // Get the view and set the selection mode to folder
        // prep the view;
        const view = leaf.view as ScribeningNoteView;
        view.setSelectionMode("folder", folderPath); // reactive
        this.setStateTo<ScribeningNoteViewState, keyof ScribeningNoteViewState>(
            view, // SvNoteView
            {
                prop: "sortField",
                val: sortField,
            }
        );
        workspace.revealLeaf(leaf);
        console.log(leaf.view);
    }
    setStateTo<T, K extends keyof T>(
        ctx: T,
        fig: { prop: K; val: T[K] }
    ): void {
        ctx[fig.prop] = fig.val;
    }

    initCssRules() {
        const SV_HIDE_YAML_CLAZZ = "daily-notes-hide-frontmatter";
        const SV_HIDE_BACKLINKS_CLAZZ = "daily-notes-hide-backlinks";
        document.body.toggleClass(
            SV_HIDE_YAML_CLAZZ,
            this.settings.hideFrontmatter
        );
        document.body.toggleClass(
            SV_HIDE_BACKLINKS_CLAZZ,
            this.settings.hideBacklinks
        );
    }

    /**
     * Patches the Obsidian Workspace prototype
     * Registers an uninstaller to revert these changes when needed.
     * - Wraps `changeLayout` to toggle a flag during layout transitions.
     * - Wraps `iterateLeaves` to prevent closing leaves during layout changes and to support both legacy and current API signatures.
     *
     */
    initWorkspacePatch(): void {
        let isWorkspaceLayoutChanging = false;
        type WspaceIterateLeaves = Workspace["iterateLeaves"];

        const uninstaller = around(Workspace.prototype, {
            // TODO What does this do?
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
            /**
             * Sets the variable allowing us to know if the workspace layout has finished its process of opening the leaves of a saved session.
             *
             * @param o_changeLayout - The original layout-changing function to wrap.
             * @returns An async function that takes the workspace and manages the layout change state.
             */
            changeLayout(o_changeLayout) {
                return async function (workspace: unknown) {
                    isWorkspaceLayoutChanging = true;
                    // changeLayout(workspace: any): Promise<void>;
                    try {
                        // Don't consider hover popovers part of the workspace while it's changing
                        await o_changeLayout.call(this, workspace);
                    } finally {
                        isWorkspaceLayoutChanging = false;
                    }
                };
            },
            /**
             * Override `iterateLeaves` for API compat and to stop the closing of open leaves when workspace layout is int the process of changing.
             * Supports both legacy and current Obsidian API signatures.
             * @param o_iterateLeaves The original iterateLeaves method to wrap.
             * @returns The wrapped iterateLeaves function.
             */
            iterateLeaves(o_iterateLeaves): WspaceIterateLeaves {
                //iterateLeaves is a recursive function that returns a boolean
                //iterateLeaves is called by all the iterate* functions
                // getLeavesOfType searches for a specific viewtype
                type leafIterator = (item: WorkspaceLeaf) => boolean | void;

                return function (arg1, arg2) {
                    // Fast exit if desired leaf found
                    if (o_iterateLeaves.call(this, arg1, arg2)) {
                        return true;
                    }

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
                    const parent: WorkspaceItem = checkIsArgAFunction(arg1)
                        ? arg2
                        : arg1;

                    // iterateAllLeaves and iterateRootLeaves call iterateLeaves with an object in the first parameter. the arg1/parent then has a value.
                    // ## dont run postprocesses when:
                    // ### on startup,
                    // #### because parent is null
                    // ### getLeavesByType is called.
                    // ### layout is changing
                    if (!parent) return false;
                    if (isWorkspaceLayoutChanging) return false; // Don't let HEs close during workspace change

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
                            for (const popover of ScribeningNoteEditor.fishoutSvNoteEditorFrom(
                                (parent as WorkspaceContainer).win
                            )) {
                                // Use old API here for compat w/0.14.x
                                if (
                                    o_iterateLeaves.call(
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
                } as WspaceIterateLeaves;
            },
            // setActiveLeaf: (next: any) =>
            //     function (leafOrView: WorkspaceLeaf, t?: any) {
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
        return;
    }

    /**
     // Used for patch workspaceleaf pinned behaviors
     * Patches the WorkspaceLeaf prototype to customize behavior for reading view, pinning,
     * and file opening events, specifically for "scribening note" leaves.
     * Prevents certain files from being recorded in recent files and quick switcher plugins.
     * Registers all patches for automatic cleanup.
     */
    initWorkspaceLeafPatch(): void {
        this.register(
            around(WorkspaceLeaf.prototype, {
                // This allows the new leaf to obtain the ability to get a Reading View.
                getRoot(old) {
                    return function () {
                        // a leaf has a view.
                        // this leaf is SNV.
                        // the SNV is an item view
                        const workspaceItem = old.call(this);

                        // getMarkdownFiles or getFiles Both call getRoot per file.
                        // getRoot returns a workspaceItem
                        // check if the which workspaceItem is the one that belongs to the folder I just clicked.
                        const isWorkspaceItemGetRootMatchCurrentLeafRoot =
                            workspaceItem?.getRoot === this.getRoot;

                        if (
                            isWorkspaceItemGetRootMatchCurrentLeafRoot === true
                        ) {
                            logger.info({ workspaceItem }, "matched");
                            return workspaceItem;
                        }
                        if (
                            isWorkspaceItemGetRootMatchCurrentLeafRoot === false
                        ) {
                            const root = workspaceItem?.getRoot();
                            // this actively
                            return root;
                        }
                        return workspaceItem;
                    };
                },
                setPinned(old): WorkspaceLeaf["setPinned"] {
                    // https://docs.obsidian.md/Reference/TypeScript+API/WorkspaceLeaf/setPinned
                    // report to the plugin when the Leaf pins itself
                    return function (pinned) {
                        old.call(this, pinned);
                        if (checkIsScribeningNoteLeaf(this) && !pinned) {
                            this.setPinned(true);
                        }
                    };
                },
                openFile(old) {
                    return function (file: TFile, openState?: OpenViewState) {
                        const isRecentFilesPluginEnabled =
                            this.app.plugins.enabledPlugins.has(
                                RECENT_FILES_PLUGIN_NAME
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
}
