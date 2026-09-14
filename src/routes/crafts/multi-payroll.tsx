import { createFileRoute } from '@tanstack/react-router'
import { MultiPayroll } from '@/crafts/multi-payroll'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/multi-payroll')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Multi-payroll frequencies - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="multi-payroll" title="Multi-payroll frequencies">
      <MultiPayroll />
    </PasswordGate>
  )
}
