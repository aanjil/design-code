<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Design system — MANDATORY, read before any UI work

1. Read `docs/DESIGN.md` first. It is the compact, canonical contract (colors,
   type, spacing, shadows, component + playground rules). Do NOT bulk-read
   `docs/foundations/*.md` — those are the long-form source; open a specific
   one only when DESIGN.md genuinely isn't enough.
2. Tokens only. Tailwind's default palette is disabled in `src/styles.css`;
   every color/type/shadow comes from an NDS token utility. Never hardcode
   hex/px, never add `dark:` color overrides (tokens handle dark mode).
3. UI primitives come from `@/components/ui/*` (shadcn on Base UI — composition
   via `render` prop, not `asChild`). Icons come from `@phosphor-icons/react`.
4. When foundations change (synced from `/Users/anjil/Documents/nds/foundations`):
   re-copy into `docs/foundations/`, update tokens in `src/styles.css`, update
   `docs/DESIGN.md`. All three stay in sync.

## What this repo is

A design-exploration playground (NDS Playground) for trying UX flows, patterns,
and micro-interactions on mock data before dev handoff — NOT a product app.

- No APIs, no network, no backend — deterministic seeded mocks in `src/mocks/`.
- Experiences ("experiments") are registered in `src/experiments/registry.ts`,
  live in `src/experiments/<slug>/`, and mount via a thin route
  `src/routes/e/<slug>.tsx` inside `<ExperimentFrame>` (variant tabs +
  annotation markers + notes panel — see DESIGN.md → Playground structure).
- The shell (`src/components/playground/`) provides the top nav, experiment
  switcher, ⌘K palette, and theme toggle. It renders from the registry — new
  experiments appear everywhere automatically.
- Experiments are presentation artifacts for stakeholders: prefer visible
  design rationale (`<Annotate>` notes, variant comparisons) over app realism.

## Project overview

TanStack Start (React) app scaffolded from the minimal starter, then extended
into the design playground described above.

### Scaffolding command

```
npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind
```

Note: the `--tailwind` flag is deprecated and ignored by the current CLI —
Tailwind v4 is always enabled in TanStack Start scaffolds, flag or not.

### Follow-up TanStack Intent commands run

```
npx @tanstack/intent@latest install   # wired the Skill Loading block into this file
npx @tanstack/intent@latest list      # 9 intent-enabled packages, 31 skills discovered
```

Run `pnpm dlx @tanstack/intent@latest list` again before any non-trivial
architectural change and load the matching skill first (see Skill Loading
above) instead of guessing at current TanStack patterns.

### Stack and choices

- Framework: React 19 + TanStack Start (SSR) + TanStack Router, file-based
  routing (`mode: file-router` in `.cta.json`).
- Styling: Tailwind CSS v4 via `@tailwindcss/vite`; NDS tokens in
  `src/styles.css` (default palette disabled). `@tailwindcss/typography` is
  installed but not imported (its prose colors depend on the disabled palette).
- Components: shadcn/ui on **Base UI** primitives (`@base-ui/react`), style
  `base-nova`, configured in `components.json`. Icons: `@phosphor-icons/react`
  (`iconLibrary: "phosphor"`).
- Fonts: Inter (UI) + Geist Mono (numeric/data) via Google Fonts import.
- Build: Vite 8. Package manager: pnpm. TypeScript strict mode.
- Testing: Vitest + `@testing-library/react` scaffolded, no tests written yet.
- Dev tools: `@tanstack/react-devtools` + `@tanstack/devtools-vite`
  (source inspection / console piping), dev-only.
- `chosenAddOns: []` in `.cta.json` — no auth, no ORM/database, no extra
  state library, no deployment adapter preconfigured. Starter example chrome
  (Header/Footer/about) was replaced by the playground shell.

### Environment variables

None required — no `process.env` / `import.meta.env` usage exists anywhere
in the generated code. If you add server functions or config later:
client-visible vars must be prefixed `VITE_`; keep secrets in server-only
files (see `start-core/execution-model` skill).

### Deployment

No deployment target was chosen. TanStack Start supports Cloudflare
Workers, Netlify, Vercel, Node/Docker, Bun, and Railway — load
`@tanstack/start-client-core#start-core/deployment` before picking one.
`pnpm build` / `pnpm preview` exist but no adapter-specific config exists
yet.

### Key architectural decisions

- File-based routes live in `src/routes/`; the route tree is generated to
  `src/routeTree.gen.ts` (manually via `pnpm generate-routes`, and
  automatically by `@tanstack/router-plugin` during dev/build).
- `src/routes/__root.tsx` defines the HTML shell (`HeadContent`/`Scripts`),
  wraps `<Outlet/>` with `Header`/`Footer`, and mounts
  `TanStackDevtools` with the router devtools panel.
- `vite.config.ts` plugin order: `devtools()` must stay first, per the
  `devtools-vite-plugin` skill.

### Known gotchas

- `--tailwind` CLI flag is a deprecated no-op (see above).
- `package.json`'s `pnpm.onlyBuiltDependencies` field is ignored by the
  installed pnpm (11.x) — this only produces a benign warning on install.
- Git was initialized by the CLI but has no commits yet.
- `shadcn init` (v4 CLI) hangs on interactive prompts in non-TTY shells —
  never run it here. `components.json` already exists; use
  `pnpm dlx shadcn@latest add <name> --yes` only.
- Generated ui components may ship unused React imports that fail strict
  `noUnusedLocals` — delete the import line.
- Route files must exist before `src/experiments/registry.ts` can reference
  their path (registry `to` is typed against `routeTree.gen.ts`); run
  `pnpm generate-routes` after adding a route.

### Next steps

- `cd my-tanstack-app && pnpm dev` — serves at http://localhost:3000.
- Make the first commit when ready.
- Build real experiments (e.g. table filters) on this structure — the
  playground demo (`/e/demo-annotations`) is the copyable reference.
- Before adding libraries or architecture (auth, data loading, a
  deployment target, etc.), consult TanStack Intent skills first.
