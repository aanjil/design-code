import { createFileRoute } from '@tanstack/react-router'
import { EmployeeFilters } from '@/crafts/employee-filters'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/employee-filters')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Employee filters - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="employee-filters" title="Employee directory filters">
      <EmployeeFilters />
    </PasswordGate>
  )
}
