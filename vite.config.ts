import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { niuralSsrStub } from './vite-plugins/niural-ssr-stub'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    // @niural/components is linked from ../../niural-fe-pkg, which has its own
    // React 18 install. Force a single React so hooks don't break.
    dedupe: ['react', 'react-dom'],
  },
  plugins: [
    devtools(),
    niuralSsrStub(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
