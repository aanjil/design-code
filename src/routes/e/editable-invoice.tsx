import { createFileRoute } from '@tanstack/react-router'
import { EditableInvoice } from '@/experiments/editable-invoice'

export const Route = createFileRoute('/e/editable-invoice')({
  component: EditableInvoice,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Editable invoice table — NDS Playground' }],
  }),
})
