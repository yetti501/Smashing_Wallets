const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

module.exports = function withAdiRegistration(config, { snippet } = {}) {
    if (!snippet) return config
    return withDangerousMod(config, [
        'android',
        async (modConfig) => {
            const assetsDir = path.join(
                modConfig.modRequest.platformProjectRoot,
                'app/src/main/assets'
            )
            await fs.promises.mkdir(assetsDir, { recursive: true })
            await fs.promises.writeFile(
                path.join(assetsDir, 'adi-registration.properties'),
                snippet
            )
            return modConfig
        },
    ])
}
