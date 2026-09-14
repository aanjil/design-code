import { createFileRoute } from '@tanstack/react-router'
import { AskEmma } from '@/crafts/ask-emma'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/ask-emma')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Ask Emma - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="ask-emma" title="Ask Emma">
      <AskEmma />
    </PasswordGate>
  )
}
