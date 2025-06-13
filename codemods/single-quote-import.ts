// codemods/fix-import-quotes.js
module.exports = function transformer(file, api, options) {
    const j = api.jscodeshift;
    const root = j(file.source);

    const didTransform = root.find(j.ImportDeclaration).forEach((path) => {
        const source = path.value.source;
        if (source.type === "StringLiteral" && typeof source.value === "string") {
            const raw = `'${source.value}'`; // force single quotes

            path.value.source = raw;
        }
    })
    .size() > 0;



  return didTransform ? root.toSource(options.printOptions || {quote: "double"}): null;
}
