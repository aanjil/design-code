import { createFileRoute } from '@tanstack/react-router'
import { SplitPay } from '@/crafts/split-pay'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/split-pay')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Split pay via Transak - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="split-pay" title="Split pay via Transak">
      <SplitPay />
    </PasswordGate>
  )
}
