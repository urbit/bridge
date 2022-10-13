import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import { comlink } from 'vite-plugin-comlink'
import { resolve } from 'path';
import nodePolyfills from 'vite-plugin-node-stdlib-browser';
import commonjs from 'vite-plugin-commonjs'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [comlink(),  commonjs({ dynamic: { loose: false }}), svgr(), react(), nodePolyfills(),],
  build: {
    outDir: 'build',
  },
  resolve: {
    alias: 
    [
      'assets',
      'components',
      'form',
      'indigo-react',
      'lib',
      'store',
      'style',
      'views',
      'worker',
    ].map(a => ({ find: a, replacement: resolve(__dirname, `src/${a}`)}))
  },
  worker: {
    plugins: [
      comlink()
    ]
  },
})
