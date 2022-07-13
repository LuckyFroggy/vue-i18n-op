import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// https://vitejs.dev/config/
export default defineConfig({
    root: resolve(__dirname),
    base: './',
    build: {
        outDir: resolve(__dirname, '../../webview'),
        emptyOutDir: true,
        rollupOptions: {
            output: {
                entryFileNames: 'static/[name].js',
                chunkFileNames: 'static/[name].js',
                assetFileNames: 'static/[name].[ext]',
            },
        },
    },
    plugins: [vue()],
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },
})
