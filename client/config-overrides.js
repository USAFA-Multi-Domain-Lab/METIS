const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')

module.exports = function override(config, env) {
  config.resolve.plugins = config.resolve.plugins.filter(
    (plugin) => !(plugin instanceof ModuleScopePlugin),
  )

  const sharedPath = path.join(__dirname, '../shared')

  config.module.rules.map((rule) => {
    if ('oneOf' in rule) {
      for (let one of rule.oneOf) {
        if (one.include && path.resolve(one.include, '../') === __dirname) {
          one.include = [one.include, sharedPath]
        }
      }
    }
  })

  return config
}
