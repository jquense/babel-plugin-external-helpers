var path = require('path');

function getPath(filePath, pathBase, dest) {
  var requirePath = path.relative(
        path.dirname(filePath),
        path.join(pathBase, dest)
      );

  if (requirePath[0] !== path.sep && requirePath[0] !== '.')
    requirePath = '.' + path.sep + requirePath

  return requirePath.replace(/\\/g, '/')
}

module.exports = function plugin(babel) {
  var Plugin = babel.Plugin || babel.Transformer
    , t = babel.types;

  return new Plugin('insert-helper-require', {
    visitor: {

      Program: function(node, parent, scope, file) {
        var options = file.opts.extra && file.opts.extra.externalHelperPlugin;

        if (!options)
          throw new Error('Missing options in babel config: `extra.externalHelperPlugin`')

        var filepath = path.normalize(file.opts.filename)
          , filebase = path.resolve(process.cwd(), path.normalize(options.base))
          , cwd = filepath.substr(0, filepath.indexOf(filebase))
          , importPath = getPath(filepath, filebase, options.path)

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
