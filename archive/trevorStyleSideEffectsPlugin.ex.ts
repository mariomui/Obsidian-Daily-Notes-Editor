/**
 * Trevor Harmon recommends this pattern. Unfortunatelly the effect.is in obsidian doesn't work properly.
 * Even though I dispatch the effect, the CodeMirror instance within that leaf
 * does not resister it. It is in fact not true. It's weird.
 * effect.is: this.type === e.
 * I am thinking that the context of the the call is effecting the ability of the effect.is to work properly.
 */
import { RangeSetBuilder, StateEffect } from "@codemirror/state";
import {
    Decoration,
    type DecorationSet,
    EditorView,
    type PluginValue,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";
// for (const effect of tr.effects) {
//     const eff = effect.is.call(effect, effectType);
//     console.log({ eff }, effect.is(effectType));
//     if (effect.is(effectType)) {
//         console.log({ value: effect.value });
//     }
// }
export const effectType = StateEffect.define<number>();
export const updateCounterStateEffectType = effectType.of(2);

export class StandardViewPlugin implements PluginValue {
    decorations: DecorationSet;
    constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
    }
    activateSomething(editorView) {
        editorView.dispatch({
            effects: effectType.of(3),
        });
    }

    destroy() {}

    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
            console.log("changed");
        }
    }
    buildDecorations(view) {
        const builder = new RangeSetBuilder<Decoration>();
        return builder.finish();
    }
}
export const StandardWrappedViewPlugin =
    ViewPlugin.fromClass(StandardViewPlugin);
