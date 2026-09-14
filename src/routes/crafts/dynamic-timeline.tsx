import { createFileRoute } from '@tanstack/react-router'
import { DynamicTimelineCraft } from '@/crafts/dynamic-timeline'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/dynamic-timeline')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({ meta: [{ title: 'Dynamic Timeline - NDS Playground' }] }),
})

function Page() {
  return (
    <PasswordGate slug="dynamic-timeline" title="Dynamic Timeline">
      <DynamicTimelineCraft />
    </PasswordGate>
  )
}
