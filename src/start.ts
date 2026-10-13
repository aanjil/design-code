import { createStart } from '@tanstack/react-start'

// @niural/components can't render on the server (see vite-plugins/niural-ssr-stub.ts),
// so every route renders client-only.
export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
