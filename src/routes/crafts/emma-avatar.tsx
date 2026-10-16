import { createFileRoute } from '@tanstack/react-router'
import { EmmaAvatarCraft } from '@/crafts/emma-avatar'
import { PasswordGate } from '@/components/playground/password-gate'

export const Route = createFileRoute('/crafts/emma-avatar')({
  component: Page,
  head: () => ({
    meta: [{ title: 'Emma avatar - NDS Playground' }],
  }),
})

function Page() {
  return (
    <PasswordGate slug="emma-avatar" title="Emma avatar">
      <div className="w-full p-4">
        <EmmaAvatarCraft />
      </div>
    </PasswordGate>
  )
}
