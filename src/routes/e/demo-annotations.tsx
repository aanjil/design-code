import { createFileRoute } from '@tanstack/react-router'
import { DemoAnnotations } from '@/experiments/demo-annotations'

export const Route = createFileRoute('/e/demo-annotations')({
  component: Page,
  head: () => ({
    meta: [{ title: 'Playground demo — NDS Playground' }],
  }),
})

function Page() {
  return (
    <div className="mx-auto max-w-[1200px] p-4">
      <DemoAnnotations />
    </div>
  )
}
