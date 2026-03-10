import { defineConfig } from 'tsdown'

export default defineConfig({
  outputOptions: {
    paths: id => {
      if (id.endsWith('.js')) return id

      // @buf packages: no exports map, need explicit .js extension
      if (id.startsWith('@buf/')) {
        return id + '.js'
      }

      // chain-registry: CJS with no exports map, directory/file imports need extensions
      if (id.startsWith('chain-registry/')) {
        const parts = id.split('/')
        // chain-registry/mainnet → chain-registry/mainnet/index.js (directory)
        // chain-registry/mainnet/asset-lists → chain-registry/mainnet/asset-lists.js (file)
        return parts.length === 2 ? id + '/index.js' : id + '.js'
      }

      return id
    },
  },
})
