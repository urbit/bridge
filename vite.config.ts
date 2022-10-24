import { defineConfig } from 'vite'
import GlobalPolyFill from "@esbuild-plugins/node-globals-polyfill";
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import { comlink } from 'vite-plugin-comlink'
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    https: true,
  },
  plugins: [basicSsl(), comlink(), svgr(), react(),],
  build: {
    outDir: 'build',
  },
  optimizeDeps: {
    esbuildOptions: {
        define: {
            global: "globalThis",
        },
        plugins: [
            GlobalPolyFill({
                process: true,
                buffer: true,
            }),
        ],
    },
  },
  resolve: {
    alias: [
      { find: 'buffer', replacement: 'buffer' },      
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
      ].map(a => ({ find: a, replacement: resolve(__dirname, `src/${a}`)})),
    ],
  },
  worker: {
    plugins: [
      comlink()
    ]
  },
  define: {
    // https://github.com/origamitower/folktale/issues/229
    "process.env.FOLKTALE_DOCS": false,
    "process.env.FOLKTALE_ASSERTIONS": false,
  },
})
