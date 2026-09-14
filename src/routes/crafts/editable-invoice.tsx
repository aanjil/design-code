import { createFileRoute } from '@tanstack/react-router'
import { EditableInvoice } from '@/crafts/editable-invoice'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/editable-invoice')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Editable invoice table - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="editable-invoice" title="Editable invoice table">
      <EditableInvoice />
    </PasswordGate>
  )
}
