import ScribeningNote from "@src/component/ScribeningNote.svelte";
import {
    type ConstructableWorkspaceSplit,
    type FishoutSvNoteEditorFromFn,
    type GetWindowsFromWorkspaceSplitFn,
    LEAF_VIEW_CLZZ,
    popoverEltoSvNoteEditorMap,
    type ScribeningNoteEditorParent,
    SV_NOTE_LEAF_COMPLEX_CSS_SELECTOR,
} from "@src/controllers/scribening-leaf-view.t";
import { NONCE3, NONCE4, NONCE5 } from "@src/lib/NONCES";
import type ScribeningPlugin from "@src/main";
// Original code from https://github.com/nothingislost/obsidian-hover-editor/blob/9ec3449be9ab3433dc46c4c3acfde1da72ff0261/src/popover.ts
// You can use this file as a basic leaf view create method in anywhere
// Please rememeber if you want to use this file, you should patch the obsidian.d.ts file
// And also monkey around the Obsidian original method.

import { genId } from "@src/utils";
import { createLoggerV2 } from "@src/utils/createLogger/createLogger";
import { LEVEL_FLAGS } from "@src/utils/createLogger/createLogger.t";
import {
    Component,
    type EphemeralState,
    HoverPopover as HP,
    type MarkdownEditView,
    type OpenViewState,
    parseLinktext,
    PopoverState,
    requireApiVersion,
    resolveSubpath,
    TFile,
    type Workspace,
    type WorkspaceLeaf,
    WorkspaceSplit,
    WorkspaceTabs,
} from "obsidian";

const logger = createLoggerV2({
    childOptions: {
        level: LEVEL_FLAGS.TRACE,
    },
    bindings: {},
});
export function checkIsScribeningNoteLeaf(
    leaf: WorkspaceLeaf,
    identifier = SV_NOTE_LEAF_COMPLEX_CSS_SELECTOR
) {
    // Work around missing enhance.js API by checking match condition instead of looking up parent
    return leaf.containerEl.matches(identifier);
}

/**
 * The type expects a class constructor with unknown number of parameters
 */
type NoSuperBase<T> = new (...args: unknown[]) => T;
/**
 * The type expects a class (or constructor function) that takes no arguments
 */
type NoSuperReturn<T> = new () => T;
/**
 * // https://docs.obsidian.md/Reference/TypeScript+API/HoverPopover
 * T is unsupplied and inferred.
 * @param {NoSuperBase<T>} // A class constructor, say HoverParent from core obsidian.
 * @return {NoSuperReturn<T>} The return is a class/constructor-function, say the newly decorated object from nosuper.
 */
function nosuper<T>(base: NoSuperBase<T>): NoSuperReturn<T> {
    const derived = function () {
        // create a new object
        // logger.infoAllOnce(new.target.prototype, new.target.name, NONCE5);
        logger.infoAllOnce(new.target.prototype, { token: NONCE5 });
        return Object.setPrototypeOf(
            new Component(),
            // whatever is produced, what we really get is a instance of component, with the link delegations to the sublcass taht calls it.
            // new.target is a reference to the constructor function that has been called by new. [ScribeningNoteEditor]
            // the prototype methods and other delegated powers are inserted into a componentBaby. It does not have ScribeningeNoteEditor Powers just the ScribeningNoteEditor's superclass'. This seems unn.
            /**
             * Component {
             *  __proto__: ScribeningNoteEditor.prototype
             * }
             */
            new.target.prototype
        );
    };

    derived.prototype = base.prototype;
    return Object.setPrototypeOf(derived, base) as any;
}

/**
 * @param {ScribeningPlugin} plugin
 * @param {HTMLElement} [initiatingEl]
 * @param {WorkspaceLeaf} [leaf]
 * @param {() => unknown} [handleShow]
 * @returns {[WorkspaceLeaf, ScribeningNoteEditor]}
 */
export const spawnLeafView = (
    plugin: ScribeningPlugin,
    initiatingEl?: HTMLElement,
    leaf?: WorkspaceLeaf,
    handleShow?: () => unknown
): [WorkspaceLeaf, ScribeningNoteEditor] => {
    // When Obsidian doesn't set any leaf active, use leaf instead.
    let parent = plugin.app.workspace
        .activeLeaf as unknown as ScribeningNoteEditorParent;
    if (!parent) parent = leaf as unknown as ScribeningNoteEditorParent;

    if (!initiatingEl) initiatingEl = parent?.containerEl;

    const hoverPopover = new ScribeningNoteEditor(
        parent,
        initiatingEl!,
        plugin,
        undefined,
        handleShow
    );
    logger.trace(
        "instancing ScribeningNoteEditor and supplying Scribening Note Editor viewcontroller to " +
            ScribeningNote.name,
        spawnLeafView.name
    );
    return [hoverPopover.attachLeaf(), hoverPopover];
};

const IS_NEW_CLAZZ = "is-new";
export class ScribeningNoteEditor extends nosuper(
    // @ts-ignore
    HP
) {
    onTarget: boolean;
    setActive: (event: MouseEvent) => void;

    lockedOut: boolean;
    abortController? = this.addChild(new Component());
    detaching = false;
    opening = false;

    // @ts-ignore
    rootSplit: WorkspaceSplit =
        new (WorkspaceSplit as ConstructableWorkspaceSplit)(
            (
                window as unknown as { app: { workspace: Workspace } }
            ).app.workspace,
            "vertical"
        );
    isPinned = true;

    titleEl: HTMLElement;
    containerEl: HTMLElement;

    // It is currently not useful.
    // leafInHoverEl: WorkspaceLeaf;

    oldPopover = this.parent?.ScribeningNoteEditor;
    document: Document;

    id = genId(8);
    bounce?: NodeJS.Timeout;
    boundOnZoomOut: () => void;

    originalPath: string; // these are kept to avoid adopting targets w/a different link
    originalLinkText: string;
    static activePopover?: ScribeningNoteEditor;

    static getWindowsFromWorkspaceSplit(): Window[] {
        // previously named: activeWindows
        const windows: Window[] = [window];
        // this is static so might go crazy
        //https://github.com/Fevol/obsidian-typings/blob/e1b292503d1a3dfea55f4d491b01dd599f74f31d/src/obsidian/augmentations/Workspace.d.ts#L93
        // @ts-ignore
        const { floatingSplit } = app.workspace;
        // logger.info({ floatingSplit });
        if (floatingSplit) {
            for (const split of floatingSplit.children) {
                if (split.win) windows.push(split.win);
            }
        }
        return windows;
    }

    static containerForDocument(plugin: ScribeningPlugin, doc: Document) {
        if (doc !== document && plugin.app.workspace.floatingSplit)
            for (const container of plugin.app.workspace.floatingSplit
                .children) {
                if (container.doc === doc) return container;
            }
        return plugin.app.workspace.rootSplit;
    }
    static getActivePopovers(
        getWindowsFromWorkspaceSplit: GetWindowsFromWorkspaceSplitFn,
        flatMapWindowToSVNoteEditorPredicate: FishoutSvNoteEditorFromFn
    ): ScribeningNoteEditor[] {
        return getWindowsFromWorkspaceSplit().flatMap(
            flatMapWindowToSVNoteEditorPredicate
        );
    }

    /**
     * Returns all `ScribeningNoteEditor` instances in the given window using global popovers
     *
     * @param win - The window to search in.
     * @returns Array of `ScribeningNoteEditor` instances.
     */
    static fishoutSvNoteEditorFrom(win?: Window): ScribeningNoteEditor[] {
        const $leafs = Array.prototype.slice.call(
            win?.document?.body.querySelectorAll(LEAF_VIEW_CLZZ) ?? []
        ) as HTMLElement[];
        return $leafs
            .map(($el) => popoverEltoSvNoteEditorMap.get($el)!)
            .filter(Boolean);
    }

    // static forLeaf(leaf: WorkspaceLeaf | undefined) {
    //     // leaf can be null such as when right clicking on an internal link
    //     const el =
    //         leaf &&
    //         document.body.matchParent.call(leaf.containerEl, ".dn-leaf-view"); // work around matchParent race condition
    //     return el ? popoverEltoSvNoteEditorMap.get(el) : undefined;
    // }

    // static iteratePopoverLeaves(
    //     ws: Workspace,
    //     cb: (leaf: WorkspaceLeaf) => boolean | void
    // ) {
    //     for (const popover of this.getActivePopovers(
    //         this.getWindowsFromWorkspaceSplit,
    //         this.fishoutSvNoteEditorFrom
    //     )) {
    //         console.log({ popover });
    //         if (popover.rootSplit && ws.iterateLeaves(cb, popover.rootSplit))
    //             return true;
    //     }
    //     return false;
    // }

    hoverEl: HTMLElement;

    constructor(
        parent: ScribeningNoteEditorParent,
        public targetEl: HTMLElement,
        public plugin: ScribeningPlugin,
        waitTime?: number,
        public handleShow?: () => unknown
    ) {
        super();

        if (waitTime === undefined) {
            waitTime = 300;
        }
        this.onTarget = true;

        this.parent = parent;
        this.waitTime = waitTime;
        this.state = PopoverState.Showing;

        this.document =
            this.targetEl?.ownerDocument ??
            window.activeDocument ??
            window.document;
        this.hoverEl = this.document.defaultView!.createDiv({
            cls: "dn-editor dn-leaf-view",
            attr: { id: "dn-" + this.id },
        });
        const { hoverEl } = this;

        this.abortController!.load();

        this.timer = window.setTimeout(this.show.bind(this), waitTime);

        this.setActive = this._setActive.bind(this);
        if (hoverEl) {
            hoverEl.addEventListener("mousedown", this.setActive);
        }
        // custom logic begin
        popoverEltoSvNoteEditorMap.set(this.hoverEl, this);
        this.hoverEl.addClass("dn-editor");
        this.containerEl = this.hoverEl.createDiv("dn-content");
        this.buildWindowControls();
        this.setInitialDimensions();
    }

    _setActive(evt: MouseEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        this.plugin.app.workspace.setActiveLeaf(this.leaves()[0], {
            focus: true,
        });
    }

    getDefaultMode() {
        // return this.parent?.view?.getMode ? this.parent.view.getMode() : "source";
        return "source";
    }

    updateLeaves() {
        if (
            this.onTarget &&
            this.targetEl &&
            !this.document.contains(this.targetEl)
        ) {
            this.onTarget = false;
            this.transition();
        }
        let leafCount = 0;
        this.plugin.app.workspace.iterateLeaves((leaf) => {
            leafCount++;
        }, this.rootSplit);

        if (leafCount === 0) {
            this.hide(); // close if we have no leaves
        }
        this.hoverEl.setAttribute("data-leaf-count", leafCount.toString());
    }

    leaves() {
        const leaves: WorkspaceLeaf[] = [];
        this.plugin.app.workspace.iterateLeaves((leaf) => {
            leaves.push(leaf);
        }, this.rootSplit);
        return leaves;
    }

    setInitialDimensions() {
        this.hoverEl.style.height = "auto";
        this.hoverEl.style.width = "100%";
    }

    transition() {
        if (this.shouldShow()) {
            if (this.state === PopoverState.Hiding) {
                this.state = PopoverState.Shown;
                window.clearTimeout(this.timer);
            }
        } else {
            if (this.state === PopoverState.Showing) {
                this.hide();
            } else {
                if (this.state === PopoverState.Shown) {
                    this.state = PopoverState.Hiding;
                    this.timer = window.setTimeout(() => {
                        if (this.shouldShow()) {
                            this.transition();
                        } else {
                            this.hide();
                        }
                    }, this.waitTime);
                }
            }
        }
    }

    buildWindowControls() {
        this.titleEl = this.document.defaultView!.createDiv("popover-titlebar");
        this.titleEl.createDiv("popover-title");

        this.containerEl.prepend(this.titleEl);
    }

    attachLeaf(): WorkspaceLeaf {
        this.rootSplit.getRoot = () =>
            this.plugin.app.workspace[
                this.document === document ? "rootSplit" : "floatingSplit"
            ]!;
        this.rootSplit.getContainer = () =>
            ScribeningNoteEditor.containerForDocument(
                this.plugin,
                this.document
            );

        this.titleEl.insertAdjacentElement(
            "afterend",
            this.rootSplit.containerEl
        );
        const leaf = this.plugin.app.workspace.createLeafInParent(
            this.rootSplit,
            0
        );

        this.updateLeaves();
        return leaf;
    }

    onload(): void {
        super.onload();
        this.registerEvent(
            this.plugin.app.workspace.on(
                "layout-change",
                this.updateLeaves,
                this
            )
        );
        this.registerEvent(
            this.plugin.app.workspace.on("layout-change", () => {
                // Ensure that top-level items in a popover are not tabbed
                // @ts-ignore
                this.rootSplit.children.forEach((item: any, index: any) => {
                    if (item instanceof WorkspaceTabs) {
                        this.rootSplit.replaceChild(
                            index,
                            (item as any).children[0]
                        );
                    }
                });
            })
        );
    }

    /**
     * non-obsidian api, called by show
     */
    onShow() {
        logger.traceOnce(this.onShow.name, "fires", { token: NONCE3 });
        // Once we've been open for closeDelay, use the closeDelay as a hiding timeout
        const closeDelay = 600;
        setTimeout(() => (this.waitTime = closeDelay), closeDelay);

        this.oldPopover?.hide();
        this.oldPopover = null;

        this.hoverEl.toggleClass(IS_NEW_CLAZZ, true);

        this.document.body.addEventListener(
            "click",
            () => {
                this.hoverEl.toggleClass(IS_NEW_CLAZZ, false);
            },
            { once: true, capture: true }
        );

        if (this.parent) {
            this.parent.ScribeningNoteEditor = this;
        }

        // Remove original view header;
        const viewHeaderEl = this.hoverEl.querySelector(".view-header");
        viewHeaderEl?.remove();

        const sizer = this.hoverEl.querySelector(".workspace-leaf");
        if (sizer) this.hoverEl.appendChild(sizer);

        // Remove original inline tilte;
        const inlineTitle = this.hoverEl.querySelector(".inline-title");
        if (inlineTitle) inlineTitle.remove();

        this.handleShow?.();
        this.handleShow = undefined; // only call it once
    }

    detect(el: HTMLElement) {
        // TODO: may not be needed? the mouseover/out handers handle most detection use cases
        const { targetEl } = this;

        if (targetEl) {
            this.onTarget = el === targetEl || targetEl.contains(el);
        }
    }

    shouldShow() {
        return this.shouldShowSelf() || this.shouldShowChild();
    }

    shouldShowChild(): boolean {
        // activeWindows, flatMapWindowToSVNoteEditorPredicate;
        return ScribeningNoteEditor.getActivePopovers(
            ScribeningNoteEditor.getWindowsFromWorkspaceSplit,
            ScribeningNoteEditor.fishoutSvNoteEditorFrom
        ).some((popover) => {
            if (
                popover !== this &&
                popover.targetEl &&
                this.hoverEl.contains(popover.targetEl)
            ) {
                return popover.shouldShow();
            }
            return false;
        });
    }

    shouldShowSelf() {
        // Don't let obsidian show() us if we've already started closing
        // return !this.detaching && (this.onTarget || this.onHover);
        return (
            !this.detaching &&
            !!(
                this.onTarget ||
                this.state == PopoverState.Shown ||
                this.document.querySelector(
                    `body>.modal-container, body > #he${this.id} ~ .menu, body > #he${this.id} ~ .suggestion-container`
                )
            )
        );
    }

    /**
     * show is a property of the html element
     * @returns void
     */
    show() {
        // native obsidian logic start
        if (!this.targetEl || this.document.body.contains(this.targetEl)) {
            this.state = PopoverState.Shown;
            this.timer = 0;
            this.targetEl.appendChild(this.hoverEl);

            this.onShow();
            logger.traceOnce("onShow invoked here by", this.show.name, {
                token: NONCE4,
            });

            this.plugin.app.workspace.onLayoutChange();

            this.load();
        } else {
            this.hide();
        }

        // native obsidian logic end

        // if this is an image view, set the dimensions to the natural dimensions of the image
        // an interactjs reflow will be triggered to constrain the image to the viewport if it's
        // too large
        if (this.hoverEl.dataset.imgHeight && this.hoverEl.dataset.imgWidth) {
            this.hoverEl.style.height =
                parseFloat(this.hoverEl.dataset.imgHeight) +
                this.titleEl.offsetHeight +
                "px";
            this.hoverEl.style.width =
                parseFloat(this.hoverEl.dataset.imgWidth) + "px";
        }
    }

    onHide() {
        this.oldPopover = null;
        if (this.parent?.ScribeningNoteEditor === this) {
            this.parent.ScribeningNoteEditor = null;
        }
    }

    hide() {
        this.onTarget = false;
        this.detaching = true;
        // Once we reach this point, we're committed to closing

        // in case we didn't ever call show()

        // A timer might be pending to call show() for the first time, make sure
        // it doesn't bring us back up after we close
        if (this.timer) {
            window.clearTimeout(this.timer);
            this.timer = 0;
        }

        // Hide our HTML element immediately, even if our leaves might not be
        // detachable yet.  This makes things more responsive and improves the
        // odds of not showing an empty popup that's just going to disappear
        // momentarily.
        this.hoverEl.hide();

        // If a file load is in progress, we need to wait until it's finished before
        // detaching leaves.  Because we set .detaching, The in-progress openFile()
        // will call us again when it finishes.
        if (this.opening) return;

        // Leave this code here to observe the state of the leaves
        const leaves = this.leaves();
        if (leaves.length) {
            // Detach all leaves before we unload the popover and remove it from the DOM.
            // Each leaf.detach() will trigger layout-changed and the updateLeaves()
            // method will then call hide() again when the last one is gone.
            // leaves[0].detach();
            leaves[0].detach();
            // this.targetEl.empty();
        } else {
            this.parent = null;
            this.abortController?.unload();
            this.abortController = undefined;
            return this.nativeHide();
        }
    }

    nativeHide() {
        const { hoverEl, targetEl } = this;
        this.state = PopoverState.Hidden;
        hoverEl.detach();

        if (targetEl) {
            const parent = targetEl.matchParent(".dn-leaf-view");
            if (parent) popoverEltoSvNoteEditorMap.get(parent)?.transition();
        }

        this.onHide();
        this.unload();
    }

    resolveLink(linkText: string, sourcePath: string): TFile | null {
        const link = parseLinktext(linkText);
        const tFile = link
            ? this.plugin.app.metadataCache.getFirstLinkpathDest(
                  link.path,
                  sourcePath
              )
            : null;
        return tFile;
    }

    async openLink(
        linkText: string,
        sourcePath: string,
        eState?: EphemeralState,
        createInLeaf?: WorkspaceLeaf
    ) {
        let file = this.resolveLink(linkText, sourcePath);
        const link = parseLinktext(linkText);
        if (!file && createInLeaf) {
            const folder =
                this.plugin.app.fileManager.getNewFileParent(sourcePath);
            file = await this.plugin.app.fileManager.createNewMarkdownFile(
                folder,
                link.path
            );
        }

        if (!file) {
            // this.displayCreateFileAction(linkText, sourcePath, eState);
            return;
        }
        const { viewRegistry } = this.plugin.app;
        const viewType = viewRegistry.typeByExtension[file.extension];
        if (!viewType || !viewRegistry.viewByType[viewType]) {
            // this.displayOpenFileAction(file);
            return;
        }

        eState = Object.assign(this.buildEphemeralState(file, link), eState);
        const parentMode = this.getDefaultMode();
        const state = this.buildState(parentMode, eState);
        const leaf = await this.openFile(
            file,
            state as OpenViewState,
            createInLeaf
        );
        const leafViewType = leaf?.view?.getViewType();
        // console.log(leaf);
        if (leafViewType === "image") {
            // TODO: temporary workaround to prevent image popover from disappearing immediately when using live preview
            if (
                this.parent?.hasOwnProperty("editorEl") &&
                (this.parent as unknown as MarkdownEditView).editorEl!.hasClass(
                    "is-live-preview"
                )
            ) {
                this.waitTime = 3000;
            }
            const img = leaf!.view.contentEl.querySelector("img")!;
            this.hoverEl.dataset.imgHeight = String(img.naturalHeight);
            this.hoverEl.dataset.imgWidth = String(img.naturalWidth);
            this.hoverEl.dataset.imgRatio = String(
                img.naturalWidth / img.naturalHeight
            );
        } else if (leafViewType === "pdf") {
            this.hoverEl.style.height = "800px";
            this.hoverEl.style.width = "600px";
        }
        if (state.state?.mode === "source") {
            this.whenShown(() => {
                // Not sure why this is needed, but without it we get issue #186
                if (requireApiVersion("1.0"))
                    (leaf?.view as any)?.editMode?.reinit?.();
                leaf?.view?.setEphemeralState(state.eState);
            });
        }
    }

    whenShown(callback: () => any) {
        // invoke callback once the popover is visible
        if (this.detaching) return;
        const existingCallback = this.handleShow;
        this.handleShow = () => {
            if (this.detaching) return;
            callback();
            if (typeof existingCallback === "function") existingCallback();
        };
        if (this.state === PopoverState.Shown) {
            this.handleShow();
            this.handleShow = undefined;
        }
    }

    async openFile(
        file: TFile,
        openState?: OpenViewState,
        useLeaf?: WorkspaceLeaf
    ) {
        if (this.detaching) return;
        const leaf = useLeaf ?? this.attachLeaf();
        this.opening = true;

        try {
            await leaf.openFile(file, openState);
        } catch (e) {
            console.error(e);
        } finally {
            this.opening = false;
            if (this.detaching) this.hide();
        }
        this.plugin.app.workspace.setActiveLeaf(leaf);
        // logger.info("set as active Leaf");

        return leaf;
    }

    buildState(parentMode: string, eState?: EphemeralState) {
        return {
            active: false, // Don't let Obsidian force focus if we have autofocus off
            state: { mode: "source" }, // Don't set any state for the view, because this leaf is stayed on another view.
            eState: eState,
        };
    }

    buildEphemeralState(
        file: TFile,
        link?: {
            path: string;
            subpath: string;
        }
    ) {
        const cache = this.plugin.app.metadataCache.getFileCache(file);
        const subpath = cache
            ? resolveSubpath(cache, link?.subpath || "")
            : undefined;
        const eState: EphemeralState = { subpath: link?.subpath };
        if (subpath) {
            eState.line = subpath.start.line;
            eState.startLoc = subpath.start;
            eState.endLoc = subpath.end || undefined;
        }
        return eState;
    }
}
