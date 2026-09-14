import { createFileRoute } from '@tanstack/react-router'
import { EmmaIntake } from '@/crafts/emma-intake'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/emma-intake')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({ meta: [{ title: 'Emma Intake - NDS Playground' }] }),
})

function Page() {
  return (
    <PasswordGate slug="emma-intake" title="Emma Intake">
      <EmmaIntake />
    </PasswordGate>
  )
}
