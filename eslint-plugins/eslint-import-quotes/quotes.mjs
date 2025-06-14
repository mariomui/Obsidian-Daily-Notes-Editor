export default {
    rules: {
        quotes: {
            meta: {
                docs: {
                    description: "allow only single quotes for ES6 imports",
                    category: "Best Practices",
                    recommended: false,
                },
                fixable: "code",
                schema: [
                    {
                        enum: ["double", "single"],
                    },
                ],
            },
            create(context) {
                const sourceCode = context.getSourceCode();
                const double = context.options[0] !== "single";
                const quoteChar = double ? '"' : "'";
                const quoteName = double ? "double quotes" : "single quotes";
                const replacePattern = !double ? /"/g : /'/g;

                function checkSpecifiers(node) {
                    // make sure it's a import declaration;
                    console.log({ node: node.type });
                    if (node.type !== "ImportDeclaration") return;
                    // if it's not a quote
                    if (node.source.raw.indexOf(quoteChar) === -1) {
                        const msg = "Use only " + quoteName + " for import";
                        context.report({
                            node,
                            message: msg,
                            fix(fixer) {
                                const replacement = sourceCode
                                    .getText(node)
                                    .replace(replacePattern, quoteChar);
                                return fixer.replaceText(node, replacement);

                                // node.source.raw = replacement; <-- this is a bad move really bad.
                            },
                        });
                    }
                }
                return {
                    Program: ({ body }) => body.forEach(checkSpecifiers),
                };
            },
        },
    },
};
