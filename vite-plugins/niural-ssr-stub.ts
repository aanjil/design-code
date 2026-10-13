import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import type { Plugin } from 'vite'

/**
 * @niural/components can't be evaluated on the server: its build bundles the
 * browser-only builds of some deps (react-textarea-autosize, @number-flow), which
 * touch `document` / `HTMLElement` at import time.
 *
 * The playground renders client-only (see `defaultSsr: false` in router.tsx and
 * <ClientOnly> in __root.tsx), so on the server we only need the import to
 * resolve. This swaps the package for a stub that re-exports every name as a
 * no-op component. Subpaths like `@niural/components/styles.css` are untouched.
 *
 * Remove once niural-fe-pkg ships an SSR-safe build.
 */
const PKG = '@niural/components'
const STUB_ID = '\0niural-components-ssr-stub'

export function niuralSsrStub(): Plugin {
  const require = createRequire(import.meta.url)

  return {
    name: 'niural-ssr-stub',
    enforce: 'pre',
    applyToEnvironment: (env) => env.name !== 'client',
    resolveId(id) {
      return id === PKG ? STUB_ID : null
    },
    load(id) {
      if (id !== STUB_ID) return null
      // Read on every load so names added by the fe-pkg watch build show up.
      const dist = readFileSync(require.resolve(PKG), 'utf8')
      const exportBlock = dist.slice(dist.lastIndexOf('export {'))
      const names = [...exportBlock.matchAll(/ as ([\w$]+)/g)].map((m) => m[1])
      return [
        'const Noop = () => null',
        `export { ${names.map((n) => `Noop as ${n}`).join(', ')} }`,
      ].join('\n')
    },
  }
}
