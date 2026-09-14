import { createFileRoute } from '@tanstack/react-router'
import { ScheduleReport } from '@/crafts/schedule-report'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/schedule-report')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Scheduled report generation - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="schedule-report" title="Scheduled report generation">
      <ScheduleReport />
    </PasswordGate>
  )
}
