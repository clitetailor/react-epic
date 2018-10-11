const {
  FuseBox,
  BabelPlugin,
  QuantumPlugin
} = require('fuse-box')
const {
  context,
  task,
  src,
  exec,
  watch,
  bumpVersion,
  npmPublish
} = require('fuse-box/sparky')
const { spawnSync } = require('child_process')

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

task('deploy', async context => {
  const test = await spawnSync('npm.cmd', ['run', 'test'], {
    stdio: 'inherit',
    encoding: 'utf-8'
  })

  if (test.status === 0) {
    await exec('build')
    await npmPublish({ path: 'dist' })
  }
})

task('build', async context => {
  await exec('clean', 'build:node', 'build:umd')
})

task('watch', async () => {
  await exec('build')

  await watch(
    '**.js',
    {
      base: 'src'
    },
    () => {
      exec('build')
    }
  ).exec()
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
