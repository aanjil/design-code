import { createFileRoute } from '@tanstack/react-router'
import { PaymentFlow } from '@/crafts/payment-flow'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/payment-flow')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Payment Flow - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="payment-flow" title="Payment Flow">
      <PaymentFlow />
    </PasswordGate>
  )
}
