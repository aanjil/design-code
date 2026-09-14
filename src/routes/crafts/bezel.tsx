import { createFileRoute } from '@tanstack/react-router'
import { Bezel } from '@/crafts/bezel'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/bezel')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Bezel - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="bezel" title="Bezel">
      <Bezel />
    </PasswordGate>
  )
}
