import { defineConfig } from 'vite'
import GlobalPolyFill from "@esbuild-plugins/node-globals-polyfill";
import nodePolyfills from 'rollup-plugin-node-polyfills';
import inject from '@rollup/plugin-inject'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import { comlink } from 'vite-plugin-comlink'
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

  const certPath = path.resolve(__dirname, 'localhost+2.pem')
  const keyPath = path.resolve(__dirname, 'localhost+2-key.pem')

  let httpsConfig
  let useBasicSsl = false

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('✓ Using mkcert certificates')
    httpsConfig = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  } else {
    console.log('⚠ mkcert certificates not found, using basicSsl')
    console.log('  Run: mkcert localhost 127.0.0.1 ::1')
    httpsConfig = true
    useBasicSsl = true
  }

  return {
    server: {
      port: 3000,
      https: httpsConfig,
    },
    plugins: [
      comlink(),
      ...(useBasicSsl ? [basicSsl()] : []),
      svgr(),
      react(),
    ],
    resolve: {
      alias: [
        { find: 'process', replacement: 'process/browser' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'https', replacement: 'agent-base' },
        ...[
          'assets',
          'components',
          'form',
          'indigo-react',
          'lib',
          'store',
          'style',
          'views',
          'worker',
        ].map(a => ({ find: a, replacement: resolve(__dirname, `src/${a}`) })),
      ],
    },
    worker: {
      plugins: [
        comlink(),
      ],
    },
    build: Object.assign(
      {
        outDir: 'build',
        rollupOptions: {
          plugins: [nodePolyfills()],
        },
      },
      mode === 'development' ? { global: {} } : {}
    ),
    optimizeDeps: {
      include: ['urbit-key-generation'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        plugins: [
          GlobalPolyFill({
            process: true,
            buffer: true,
          }),
        ],
      },
    },
    define: Object.assign({
      // https://github.com/origamitower/folktale/issues/229
      "process.env.FOLKTALE_DOCS": false,
      "process.env.FOLKTALE_ASSERTIONS": false,
    },
      mode === 'production' ? {
        rollupOptions: {
          plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],
        },
      } : {}
    )
  };
});
