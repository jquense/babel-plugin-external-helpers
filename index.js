
module.exports = function plugin(babel) {
  var Plugin = babel.Plugin || babel.Transformer
    , t = babel.types;

  return new Plugin('insert-helper-require', {
    visitor: {

      Program: function(node, parent, scope, file) {
        var filepath = path.normalize(file.opts.filename)
          , cwd = filepath.substr(0, filepath.indexOf(path.normalize(file.opts.filenameRelative)))
          , importPath = getPath(filepath, cwd, file.opts.extra.externalHelperPath)

        var modulePath = file.resolveModuleSource(importPath)
          , name = 'babelHelpers'
          , id = file.dynamicImportIds[name] = t.identifier(name);

        if (!Object.keys(file.usedHelpers || {}).length)
          return node

        var first = node.body[0]
          , declar = t.variableDeclaration("var", [
            t.variableDeclarator(id,
              t.callExpression(
                t.identifier("require"), [ t.literal(modulePath) ]
              )
            )
          ])

        if (t.isExpressionStatement(first) && t.isLiteral(first.expression, { value: "use strict" }))
          node.body.splice(1, 0, declar)
        else
          node.body.unshift(declar)

        return node
      }
    }
  })
}
