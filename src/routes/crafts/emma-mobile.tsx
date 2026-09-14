import { createFileRoute } from '@tanstack/react-router'
import { EmmaMobile } from '@/crafts/emma-mobile'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/emma-mobile')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Emma Mobile - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="emma-mobile" title="Emma Mobile">
      <EmmaMobile />
    </PasswordGate>
  )
}
