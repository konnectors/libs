const path = require('path')
const fs = require('fs')
const CopyPlugin = require('copy-webpack-plugin')
const { configureDeployOnLocalStack } = require('./webpack.config.deploy.js')

const currentDirectory = process.cwd()
const readManifest = () =>
  JSON.parse(
    fs.readFileSync(path.join(currentDirectory, './manifest.konnector'))
  )
const manifest = readManifest()

let plugins = [
  new CopyPlugin({
    patterns: [{ from: 'manifest.konnector' }, { from: 'assets' }]
  })
]

plugins = configureDeployOnLocalStack(
  process.env.UPDATE_ON_LOCAL_COZY_STACK,
  plugins,
  manifest.slug
)

module.exports = {
  mode: 'none',
  output: {
    path: path.join(process.cwd(), 'build'),
    filename: 'main.js'
  },
  plugins
}
