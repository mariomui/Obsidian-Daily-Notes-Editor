import { syntaxTree } from "@codemirror/language";
import {
    type Extension,
    RangeSetBuilder,
    StateField,
    // Text,
    type Transaction,
} from "@codemirror/state";
import {
    Decoration,
    type DecorationSet,
    EditorView,
    ViewPlugin,
    // type Panel,
    // showPanel,
    type ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import type Scribening from "@src/main";
import { logger } from "@src/utils";
// import { ViewPlugin, ViewUpdate } from "@codemirror/view";

export const emojiListField = StateField.define<DecorationSet>({
    create(state): DecorationSet {
        return Decoration.none;
    },
    update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        syntaxTree(transaction.state).iterate({
            enter(node) {
                if (node.type.name.startsWith("list")) {
                    // Position of the '-' or the '*'.
                    const listCharFrom = node.from - 2;

                    builder.add(
                        listCharFrom,
                        listCharFrom + 1,
                        Decoration.replace({
                            widget: new LineWidget(),
                        })
                    );
                }
            },
        });

        return builder.finish();
    },
    provide(field: StateField<DecorationSet>): Extension {
        return EditorView.decorations.from(field);
    },
});

// init(create: fn(state: EditorState) → Value) → Extension
// Returns an extension that enables this field and overrides the way it is initialized. Can be useful when you need to provide a non-default starting value for the field.
export const pluginField = StateField.define<Scribening>({
    create(state): any {
        // state is always the Plugin
        // create state never gets called.
        // create(state: EditorState) → Value
        // Creates the initial value for the field when a state is created.
        // only triggers on effects
        logger({ ctx: this });
        return state;
    },
    update(state, tr) {
        // state is pluginField
        // when any view is touched, this update Fires

        return state;
    },
});
// const plugin = update.view.state.field(pluginField);

export class LineWidget extends WidgetType {
    toDOM(view: EditorView): HTMLElement {
        const hr = document.createElement("hr");
        hr.addClasses(["scribening", "pagebreak"]);
        return hr;
    }
    // side: 1, // place after the word
}

export const every250WordsPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = this.buildDecorations(update.view);
            }
        }

        buildDecorations(view: EditorView): DecorationSet {
            const builder = new RangeSetBuilder<Decoration>();

            const text = view.state.doc.toString();
            const wordRegex = /\b\w+\b/g;
            let match;
            let count = 0;
            // const decos: any[] = [];

            while ((match = wordRegex.exec(text)) !== null) {
                count++;
                if (count % 250 === 0) {
                    const pos = match.index + match[0].length;
                    builder.add(
                        pos, //from
                        pos, // to
                        Decoration.replace({
                            widget: new LineWidget(),
                            // side: -1,
                            inclusive: true,
                            inclusiveStart: true,
                            inclusiveEnd: true,
                        })
                    );
                    // decos.push(
                    //     Decoration.widget({
                    //         widget: new Xwidget(),
                    //         side: 1,
                    //     }).range(pos)
                    // );
                }
            }
            return builder.finish();
            // return Decoration.set(decos, true);
        }
    },
    {
        decorations: (viewPlugin) => {
            return viewPlugin.decorations;
        },
    }
);

const wordRegex = /\b\w+\b/g;

export const wordField = StateField.define<string[]>({
    create(state) {
        return getWords(state.doc.toString());
    },
    update(words, tr) {
        // update triggers whenever
        if (tr.docChanged) {
            return getWords(tr.newDoc.toString());
        }
        return words;
    },
});

function getWords(text: string): string[] {
    return [...text.matchAll(wordRegex)].map((match) => match[0]);
}
// function wordCountPanel(view: EditorView): Panel {
//     let dom = document.createElement("div");
//     dom.textContent = countWords(view.state.doc);
//     return {
//         dom,
//         update(update) {
//             if (update.docChanged)
//                 dom.textContent = countWords(update.state.doc);
//         },
//     };
// }
// function countWords(doc: Text) {
//     let count = 0,
//         iter = doc.iter();
//     while (!iter.next().done) {
//         let inWord = false;
//         for (let i = 0; i < iter.value.length; i++) {
//             let word = /\w/.test(iter.value[i]);
//             if (word && !inWord) count++;
//             inWord = word;
//         }
//     }
//     return `Word count: ${count}`;
// }
// export const panelExtension = showPanel.of(wordCountPanel);

// const decoration = Decoration.replace({
//     widget: new EmojiWidget(),
// });

// class EmojiListPlugin implements PluginValue {
//     decorations: DecorationSet;

//     constructor(view: EditorView) {
//         this.decorations = this.buildDecorations(view);
//     }

//     update(update: ViewUpdate) {
//         if (update.docChanged || update.viewportChanged) {
//             this.decorations = this.buildDecorations(update.view);
//         }
//     }

//     destroy() {}

//     buildDecorations(view: EditorView): DecorationSet {
//         const builder = new RangeSetBuilder<Decoration>();

//         for (let { from, to } of view.visibleRanges) {
//             syntaxTree(view.state).iterate({
//                 from,
//                 to,
//                 enter(node) {
//                     if (node.type.name.startsWith("list")) {
//                         // Position of the '-' or the '*'.
//                         const listCharFrom = node.from - 2;

//                         builder.add(
//                             listCharFrom,
//                             listCharFrom + 1,
//                             Decoration.replace({
//                                 widget: new EmojiWidget(),
//                             })
//                         );
//                     }
//                 },
//             });
//         }

//         return builder.finish();
//     }
// }

// const pluginSpec: PluginSpec<EmojiListPlugin> = {
//     decorations: (value: EmojiListPlugin) => value.decorations,
// };

// export const emojiListPlugin = ViewPlugin.fromClass(
//     EmojiListPlugin,
//     pluginSpec
// );
