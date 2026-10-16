import { UserPlus } from '@phosphor-icons/react'
import { Annotate } from '@/components/playground/annotations'
import { CraftFrame } from '@/components/playground/craft-frame'
import { Button } from '@niural/components'
import { fmtMoney, initials, people } from '@/mocks/people'
import type { Person } from '@/mocks/people'
import { cn } from '@/lib/utils'

/**
 * Reference craft. Copy this folder + its route file to start a new one:
 * variants compare two densities of the same card, annotations explain the
 * system rules each detail follows.
 */
export function DemoAnnotations() {
  return (
    <CraftFrame
      slug="demo-annotations"
      variants={[
        {
          id: 'comfortable',
          label: 'Comfortable',
          node: <TeamCard density="comfortable" />,
          note: 'Default density - role line visible.',
        },
        {
          id: 'compact',
          label: 'Compact',
          node: <TeamCard density="compact" />,
          note: 'Dense scanning - one line per member.',
        },
      ]}
    />
  )
}

const personStatusClass: Record<Person['status'], string> = {
  active:
    'bg-success-highlight text-success border-success-muted',
  invited:
    'bg-info-highlight text-info border-info-muted',
  offboarded: 'bg-highlight text-muted border-base',
}

function TeamCard({ density }: { density: 'comfortable' | 'compact' }) {
  const rows = people.slice(0, 5)
  const comfortable = density === 'comfortable'

  return (
    <div className="mx-auto max-w-[560px] py-4">
      <Annotate
        n={1}
        title="Card recipe"
        note="bg-base + card + 12px padding. The 1px ring is part of the shadow token - no border class on top."
      >
        <div className="rounded-xl bg-base p-3 card">
          <div className="flex items-center justify-between gap-3 pb-2">
            <p className="text-label-small">Team members</p>
            <Annotate
              n={2}
              inline
              title="Primary action"
              note="Buttons use Label type. Icons are 16px with a 4px gap to text (icon+text optical rule in spacing.md)."
            >
              <Button type="button" size="sm" leftIcon={<UserPlus className="size-4" />}>
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
                    'flex shrink-0 items-center justify-center rounded-full bg-brand-muted text-caption-sm font-medium text-brand',
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
                    title="Stacked text - no gap"
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
                    note="Every numeric value stays in Inter with tabular-nums (tabular-nums text-paragraph-xsmall) so digits align across rows."
                  >
                    <span className="tabular-nums text-paragraph-xsmall">
                      {fmtMoney(person.salary)}
                    </span>
                  </Annotate>
                ) : (
                  <span className="tabular-nums text-paragraph-xsmall">
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
      <p className="truncate text-label-small">{person.name}</p>
      {comfortable && (
        <p className="truncate text-paragraph-xsmall text-muted">
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
        'rounded-full border px-2 py-px text-caption-sm font-medium capitalize',
        personStatusClass[person.status],
      )}
    >
      {person.status}
    </span>
  )
}
