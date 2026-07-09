import { createFileRoute } from '@tanstack/react-router'
import { EmployeeFilters } from '@/experiments/employee-filters'

export const Route = createFileRoute('/e/employee-filters')({
  component: EmployeeFilters,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Employee filters — NDS Playground' }],
  }),
})
