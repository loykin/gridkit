import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templateDir = join(repoRoot, 'scripts/consumer-template')
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
const playgroundPkg = JSON.parse(readFileSync(join(repoRoot, 'playground/package.json'), 'utf8'))

const workDir = mkdtempSync(join(tmpdir(), 'gridkit-consumer-'))
const appDir = join(workDir, 'app')

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: process.env.npm_config_cache ?? join(workDir, 'npm-cache'),
      ...options.env,
    },
  })

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
  }

  return result.stdout ?? ''
}

function version(section, name) {
  const value = pkg[section]?.[name] ?? playgroundPkg[section]?.[name]
  if (!value) {
    throw new Error(`Missing ${section}.${name} in package metadata`)
  }
  return value
}

try {
  mkdirSync(appDir, { recursive: true })

  const packOutput = run('npm', ['pack', '--json', '--pack-destination', workDir], {
    capture: true,
  })
  const packInfo = JSON.parse(packOutput)
  const tarballPath = join(workDir, packInfo[0].filename)

  writeFileSync(
    join(appDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'gridkit-consumer-verification',
        private: true,
        type: 'module',
        scripts: {
          'type-check': 'tsc --noEmit',
          build: 'vite build',
        },
        dependencies: {
          '@loykin/gridkit': `file:${tarballPath}`,
          '@tanstack/react-table': version('peerDependencies', '@tanstack/react-table'),
          '@tanstack/react-virtual': version('peerDependencies', '@tanstack/react-virtual'),
          '@types/react': version('devDependencies', '@types/react'),
          '@types/react-dom': version('devDependencies', '@types/react-dom'),
          '@vitejs/plugin-react': version('devDependencies', '@vitejs/plugin-react'),
          react: version('peerDependencies', 'react'),
          'react-dom': version('peerDependencies', 'react-dom'),
          typescript: version('devDependencies', 'typescript'),
          vite: version('devDependencies', 'vite'),
        },
        devDependencies: {},
      },
      null,
      2,
    )}\n`,
  )

  writeFileSync(
    join(appDir, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: 'ESNext',
          moduleResolution: 'Bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
        },
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  )

  writeFileSync(
    join(appDir, 'vite.config.ts'),
    readFileSync(join(templateDir, 'vite.config.ts'), 'utf8'),
  )

  writeFileSync(
    join(appDir, 'index.html'),
    readFileSync(join(templateDir, 'index.html'), 'utf8'),
  )

  mkdirSync(join(appDir, 'src'), { recursive: true })
  writeFileSync(
    join(appDir, 'src/main.tsx'),
    readFileSync(join(templateDir, 'src/main.tsx'), 'utf8'),
  )

  run('pnpm', ['install', '--ignore-scripts'], { cwd: appDir })
  run('pnpm', ['type-check'], { cwd: appDir })
  run('pnpm', ['build'], { cwd: appDir })

  console.log(`Consumer package verification passed: ${appDir}`)
} finally {
  if (process.env.KEEP_GRIDKIT_CONSUMER_TEST !== '1') {
    rmSync(workDir, { recursive: true, force: true })
  }
}
