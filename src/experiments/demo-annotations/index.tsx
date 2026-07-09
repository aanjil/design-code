import { UserPlus } from '@phosphor-icons/react'
import { Annotate } from '@/components/playground/annotations'
import { ExperimentFrame } from '@/components/playground/experiment-frame'
import { Button } from '@/components/ui/button'
import { fmtMoney, initials, people } from '@/mocks/people'
import type { Person } from '@/mocks/people'
import { cn } from '@/lib/utils'

/**
 * Reference experiment. Copy this folder + its route file to start a new one:
 * variants compare two densities of the same card, annotations explain the
 * system rules each detail follows.
 */
export function DemoAnnotations() {
  return (
    <ExperimentFrame
      slug="demo-annotations"
      variants={[
        {
          id: 'comfortable',
          label: 'Comfortable',
          node: <TeamCard density="comfortable" />,
          note: 'Default density — role line visible.',
        },
        {
          id: 'compact',
          label: 'Compact',
          node: <TeamCard density="compact" />,
          note: 'Dense scanning — one line per member.',
        },
      ]}
    />
  )
}

const personStatusClass: Record<Person['status'], string> = {
  active:
    'bg-background-success-highlight text-text-success-base border-border-success-muted',
  invited:
    'bg-background-info-highlight text-text-info-base border-border-info-muted',
  offboarded: 'bg-background-highlight text-text-muted border-border-base',
}

function TeamCard({ density }: { density: 'comfortable' | 'compact' }) {
  const rows = people.slice(0, 5)
  const comfortable = density === 'comfortable'

  return (
    <div className="mx-auto max-w-[560px] py-4">
      <Annotate
        n={1}
        title="Card recipe"
        note="bg-background-base + shadow-card + 12px padding. The 1px ring is part of the shadow token — no border class on top."
      >
        <div className="rounded-xl bg-background-base p-3 shadow-card">
          <div className="flex items-center justify-between gap-3 pb-2">
            <p className="text-label-sm">Team members</p>
            <Annotate
              n={2}
              inline
              title="Primary action"
              note="Buttons use Label type. Icons are 16px with a 4px gap to text (icon+text optical rule in spacing.md)."
            >
              <Button size="sm">
                <UserPlus />
                Invite
              </Button>
            </Annotate>
          </div>

          <div>
            {rows.map((person, index) => (
              <div
                key={person.id}
                className={cn(
                  'flex items-center gap-3',
                  comfortable ? 'py-2.5' : 'py-1.5',
                )}
              >
                <span
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full bg-brand-muted text-caption-md text-brand-text',
                    comfortable ? 'size-8' : 'size-6',
                  )}
                >
                  {initials(person.name)}
                </span>

                {index === 0 ? (
                  <Annotate
                    n={3}
                    className="min-w-0 flex-1"
                    side="bottom-left"
                    title="Stacked text — no gap"
                    note="Name (Label/Small) over role (Paragraph/XSmall, muted). 150% line-height provides the separation; never add gap-1."
                  >
                    <PersonCell person={person} comfortable={comfortable} />
                  </Annotate>
                ) : (
                  <div className="min-w-0 flex-1">
                    <PersonCell person={person} comfortable={comfortable} />
                  </div>
                )}

                {index === 0 ? (
                  <Annotate
                    n={4}
                    inline
                    title="Mono for money"
                    note="Every numeric value uses Geist Mono (font-mono text-mono-xs) so digits align across rows."
                  >
                    <span className="font-mono text-mono-xs">
                      {fmtMoney(person.salary)}
                    </span>
                  </Annotate>
                ) : (
                  <span className="font-mono text-mono-xs">
                    {fmtMoney(person.salary)}
                  </span>
                )}

                {index === 0 ? (
                  <Annotate
                    n={5}
                    inline
                    side="top-left"
                    title="Semantic status pairing"
                    note="bg + text + border all come from the same family: success for active, info for invited, neutral for offboarded. Accent colors are never used for status."
                  >
                    <PersonStatus person={person} />
                  </Annotate>
                ) : (
                  <PersonStatus person={person} />
                )}
              </div>
            ))}
          </div>
        </div>
      </Annotate>
    </div>
  )
}

function PersonCell({
  person,
  comfortable,
}: {
  person: Person
  comfortable: boolean
}) {
  return (
    <>
      <p className="truncate text-label-sm">{person.name}</p>
      {comfortable && (
        <p className="truncate text-paragraph-xs text-text-muted">
          {person.role}
        </p>
      )}
    </>
  )
}

function PersonStatus({ person }: { person: Person }) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-px text-caption-md capitalize',
        personStatusClass[person.status],
      )}
    >
      {person.status}
    </span>
  )
}
