import { createFileRoute } from '@tanstack/react-router'
import { DocPage, InlineCode, PropsTable, ShowcaseSection } from '@/docs/doc-kit'
import { Search, SidebarNav } from '@/components/nds/ai/navigation'

export const Route = createFileRoute('/docs/components/ai-navigation')({
  component: AiNavigationDoc,
  head: () => ({ meta: [{ title: 'Navigation & discovery - NDS Docs' }] }),
})

function AiNavigationDoc() {
  return (
    <DocPage
      title="Navigation & discovery"
      description="Getting around the product itself - an AI-workspace sidebar and a command-style search that suggests prompts instead of showing a blank box."
    >
      <ShowcaseSection
        index={1}
        title="Sidebar Nav"
        description="Thin AI variant of Sidebar: workspace switcher + New task CTA on top, badge counts instead of icons."
        props={
          <PropsTable
            props={[
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the panel.' },
              { name: 'activeItem', type: 'string', default: '-', description: 'Label of the active item (white pill + brand text).' },
              { name: 'onNavigate', type: '(label: string) => void', default: '-', description: 'Called when a nav item is clicked - omit to leave it decorative.' },
              { name: 'onNewTask', type: '() => void', default: '-', description: 'Called when "New task" is clicked.' },
            ]}
          />
        }
      >
        <div className="h-[420px] w-[260px] overflow-hidden rounded-xl">
          <SidebarNav activeItem="Home" />
        </div>
      </ShowcaseSection>

      <ShowcaseSection
        index={2}
        title="Search"
        description="Empty input surfaces suggested agent prompts as a Suggested group; typing runs a plain substring filter over the same list."
        props={
          <PropsTable
            props={[
              { name: 'className', type: 'string', default: '-', description: 'Extra classes on the command panel.' },
            ]}
          />
        }
      >
        <div className="w-full max-w-[420px]">
          <Search />
        </div>
      </ShowcaseSection>

      <section className="border-t border-dashed border-border-muted pt-8">
        <h2 className="text-title-h5 text-text-primary">Rules</h2>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            SidebarNav reuses <InlineCode>Sidebar</InlineCode>'s panel language (200px translucent
            blur, hover/active pill) - don't fork the base Sidebar for icon-less, badge-bearing
            nav sets, use this instead.
          </li>
          <li>
            Search's empty state is never a blank box or "no results" - it always offers something
            to ask. <InlineCode>CommandEmpty</InlineCode> only shows once there's real input with
            zero matches.
          </li>
        </ul>
      </section>
    </DocPage>
  )
}
