const {
  FuseBox,
  BabelPlugin,
  QuantumPlugin
} = require('fuse-box')
const { context, task, src, exec } = require('fuse-box/sparky')

context(
  class FuseContext {
    getConfig(options = {}) {
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
  const fuse = context.getConfig({
    target: 'server@esnext',
    globals: {
      default: '*'
    },
    tsConfig: [
      {
        compilerOptions: {
          module: 'commonjs',
          allowSyntheticDefaultImports: true
        }
      }
    ],
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
      }),
      QuantumPlugin({
        target: 'npm',
        bakeApiIntoBundle: 'react-epic',
        containedAPI: true
      })
    ]
  })

  fuse.bundle('react-epic').instructions(`> [index.js]`)
  await fuse.run()
})

task('build:umd', async context => {
  const fuse = context.getConfig({
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

  fuse.bundle('react-epic.umd').instructions(`> [index.js]`)
  await fuse.run()
})
