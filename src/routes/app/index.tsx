import { createFileRoute, redirect } from '@tanstack/react-router'
import { MASTER_IA } from '@/crafts/master-ia'

export const Route = createFileRoute('/app/')({
  staticData: { layout: 'app' },
  beforeLoad: () => {
    throw redirect({ to: '/app/$section', params: { section: MASTER_IA[0].key } })
  },
})
