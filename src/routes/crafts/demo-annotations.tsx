import { createFileRoute } from '@tanstack/react-router'
import { DemoAnnotations } from '@/crafts/demo-annotations'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/demo-annotations')({
  component: Page,
  head: () => ({
    meta: [{ title: 'Playground demo - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="demo-annotations" title="Playground demo">
      <div className="mx-auto max-w-[1200px] p-4">
        <DemoAnnotations />
      </div>
    </PasswordGate>
  )
}
