import { createFileRoute } from '@tanstack/react-router'
import { TokensBilling } from '@/crafts/tokens-billing'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/tokens-billing')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Tokens & billing - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="tokens-billing" title="Tokens & billing">
      <TokensBilling />
    </PasswordGate>
  )
}
