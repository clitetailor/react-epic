const { FuseBox, BabelPlugin } = require('fuse-box')
const { context, task, src, exec } = require('fuse-box/sparky')

context(
  class FuseContext {
    getConfig(options) {
      return FuseBox.init({
        homeDir: 'src',
        output: 'dist/$name.js',
        plugins: [
          BabelPlugin({
            config: {
              presets: ['env', 'stage-2', 'react'],
              plugins: [
                [
                  'transform-decorators-legacy',
                  {
                    legacy: true
                  }
                ],
                'transform-class-properties',
                'transform-runtime'
              ]
            }
          })
        ],
        ...options
      })
    }
  }
)

task('default', async context => {
  await exec('clean', 'build:node', 'build:umd')
})

task('clean', async context => {
  await src('./dist')
    .clean('dist/')
    .exec()
})

task('build:node', async context => {
  /**
   * @type {FuseBox}
   */
  const fuseDefault = context.getConfig({
    target: 'server@esnext',
    tsConfig: [
      {
        compilerOptions: {
          allowSyntheticDefaultImports: true
        }
      }
    ]
  })

  fuseDefault.bundle('react-epic').instructions(`> index.js`)
  await fuseDefault.run()
})

task('build:umd', async context => {
  /**
   * @type {FuseBox}
   */
  const fuseUMD = context.getConfig({
    target: 'browser@esnext',
    globals: {
      default: 'reactEpic'
    },
    tsConfig: [
      {
        compilerOptions: {
          module: 'umd',
          allowSyntheticDefaultImports: true
        }
      }
    ]
  })

  fuseUMD.bundle('react-epic.umd').instructions(`> index.js`)
  await fuseUMD.run()
})
