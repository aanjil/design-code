import { createFileRoute } from '@tanstack/react-router'
import { OrgSettings } from '@/crafts/org-settings'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/org-settings')({
  component: Page,
  staticData: { layout: 'canvas' },
  head: () => ({
    meta: [{ title: 'Settings - organization - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="org-settings" title="Settings - organization">
      <OrgSettings />
    </PasswordGate>
  )
}
