const WebpackShellPlugin = require('webpack-shell-plugin-next')

module.exports.configureDeployOnLocalStack = (
  UPDATE_ON_LOCAL_COZY_STACK,
  plugins,
  slug
) => {
  // when $UPDATE_ON_LOCAL_COZY_STACK env var is defined, update it automatically on local
  // cozy stack which will use $COZY_DOMAIN env var to know which cozy-stack instance to
  // target (cozy.localhost:8080 by default)
  if (UPDATE_ON_LOCAL_COZY_STACK) {
    return [
      ...plugins,
      new WebpackShellPlugin({
        onAfterDone: {
          scripts: [`cozy-stack konnectors update ${slug}`],
          blocking: true // to wait for the end command execution
        }
      })
    ]
  }
  return plugins
}
