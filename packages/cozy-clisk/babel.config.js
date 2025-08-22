module.exports = function (api) {
  const isESM = api.env('esm')

  // Custom plugin to add .mjs extensions to JS imports but keep .json for JSON
  const addMjsExtension = function () {
    return {
      visitor: {
        ImportDeclaration(path) {
          const source = path.node.source.value
          // Only transform relative imports that don't already have extensions
          if (source.startsWith('./') || source.startsWith('../')) {
            // Don't transform if it already has an extension
            if (!/\.[a-zA-Z0-9]+$/.test(source)) {
              path.node.source.value = source + '.mjs'
            }
          }
        },
        ExportNamedDeclaration(path) {
          if (path.node.source) {
            const source = path.node.source.value
            if (source.startsWith('./') || source.startsWith('../')) {
              if (!/\.[a-zA-Z0-9]+$/.test(source)) {
                path.node.source.value = source + '.mjs'
              }
            }
          }
        },
        ExportAllDeclaration(path) {
          if (path.node.source) {
            const source = path.node.source.value
            if (source.startsWith('./') || source.startsWith('../')) {
              if (!/\.[a-zA-Z0-9]+$/.test(source)) {
                path.node.source.value = source + '.mjs'
              }
            }
          }
        }
      }
    }
  }

  if (isESM) {
    return {
      presets: [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: {
              node: '20'
            }
          }
        ]
      ],
      plugins: [addMjsExtension]
    }
  }

  return {
    presets: [['cozy-app']]
  }
}
