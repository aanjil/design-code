import { createFileRoute } from '@tanstack/react-router'
import { Flame, Gift, WarningCircle } from '@phosphor-icons/react'
import { DocPage, DocSection, InlineCode, PropsTable, Specimen } from '@/docs/doc-kit'
import { AppBar } from '@/components/nds/app-bar'

export const Route = createFileRoute('/docs/components/app-bar')({
  component: AppBarDoc,
  head: () => ({ meta: [{ title: 'AppBar - NDS Docs' }] }),
})

function AppBarDoc() {
  return (
    <DocPage
      title="AppBar"
      description="58px top navigation on surface-2: org context, product nav pills, wallet balance, Ask Emma, search and settings. Active pill = background-base + brand text."
    >
      <DocSection
        title="Employer (default)"
        note="The full product nav. Scroll horizontally - it renders at its natural 1512px width."
      >
        <Specimen wide className="p-0">
          <div className="min-w-[1280px]">
            <AppBar activeItem="Payments" />
          </div>
        </Specimen>
      </DocSection>

      <DocSection title="Role variants" note="Nav sets swap per audience; layout stays.">
        <div className="flex flex-col gap-4">
          <Specimen wide className="p-0" label="role='contractor'">
            <div className="min-w-[1280px]">
              <AppBar role="contractor" activeItem="My Work" />
            </div>
          </Specimen>
          <Specimen wide className="p-0" label="role='employee' · walletActive">
            <div className="min-w-[1280px]">
              <AppBar role="employee" activeItem="Benefits" walletActive />
            </div>
          </Specimen>
        </div>
      </DocSection>

      <DocSection
        title="Token balance + notifications"
        note="Opt-in via tokenBalance/notifications - undefined renders exactly as before, so every existing usage is unaffected. tokenBalance turns AiButton into a compound tokens + Ask Emma pill; its onClick fires from the token segment only (e.g. navigate to Settings > AI > Tokens). Promoted from the tokens-billing craft."
      >
        <Specimen wide className="p-0">
          <div className="min-w-[1280px]">
            <AppBar
              activeItem="Payments"
              tokenBalance={{ tokens: 234000 }}
              notifications={[
                {
                  id: 'n1',
                  icon: Gift,
                  tone: 'success',
                  title: '$600.00 credit added',
                  description: 'Granted by Niural - applies to your Niural fee and token purchases.',
                  date: 'Jul 12',
                },
                {
                  id: 'n2',
                  icon: Flame,
                  tone: 'warning',
                  title: '180 tokens left',
                  description: 'About 1 payroll run. Auto-reload fires at 50.',
                  date: 'Jul 26',
                },
                {
                  id: 'n3',
                  icon: WarningCircle,
                  tone: 'error',
                  title: "You're out of tokens",
                  description: 'Emma is paused. Buy tokens to start it again.',
                  date: 'Jul 27',
                },
              ]}
            />
          </div>
        </Specimen>
      </DocSection>

      <DocSection
        title="Mini (icon rail)"
        note="Same role/nav-item logic and state, collapsed into a 64px vertical rail - tooltips stand in for the hidden labels. Replaces AppBar in the layout (give it h-full from a row-flex parent); it isn't a second nav alongside the full bar."
      >
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <Specimen className="p-0" label="role='employer'">
            <div className="h-[480px] overflow-hidden rounded-xl">
              <AppBar mini activeItem="Payments" />
            </div>
          </Specimen>
          <Specimen className="p-0" label="role='multi-entity' · tokenBalance · notifications">
            <div className="h-[480px] overflow-hidden rounded-xl">
              <AppBar
                mini
                role="multi-entity"
                activeItem="People"
                tokenBalance={{ tokens: 234000 }}
                notifications={[
                  {
                    id: 'n1',
                    icon: Gift,
                    tone: 'success',
                    title: '$600.00 credit added',
                    description: 'Granted by Niural - applies to your Niural fee and token purchases.',
                    date: 'Jul 12',
                  },
                ]}
              />
            </div>
          </Specimen>
          <Specimen className="p-0" label="role='contractor'">
            <div className="h-[480px] overflow-hidden rounded-xl">
              <AppBar mini role="contractor" activeItem="My Work" />
            </div>
          </Specimen>
          <Specimen className="p-0" label="role='employee'">
            <div className="h-[480px] overflow-hidden rounded-xl">
              <AppBar mini role="employee" activeItem="Benefits" />
            </div>
          </Specimen>
        </div>
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          props={[
            {
              name: 'role',
              type: "'employer' | 'multi-entity' | 'contractor' | 'employee'",
              default: "'employer'",
              description: 'Which nav set renders (see variants above).',
            },
            {
              name: 'activeItem',
              type: 'string',
              default: 'first nav item',
              description: 'Label of the selected nav pill. Clicking pills updates it locally.',
            },
            {
              name: 'walletActive',
              type: 'boolean',
              default: 'false',
              description: 'Renders the wallet button in its pressed/selected state.',
            },
            {
              name: 'aiSelected',
              type: 'boolean',
              default: 'false',
              description: 'Ask Emma button starts selected.',
            },
            {
              name: 'onSettingsClick',
              type: '() => void',
              default: 'undefined',
              description: 'Wires the existing Settings gear (employer/multi-entity) to real navigation.',
            },
            {
              name: 'tokenBalance',
              type: '{ tokens: number; onClick?: () => void }',
              default: 'undefined',
              description:
                'Turns AiButton into a compound pill - Emma mark + compact token count (e.g. "234k"), then Ask Emma. onClick fires from the token segment only.',
            },
            {
              name: 'notifications',
              type: 'Array<AppBarNotification>',
              default: 'undefined',
              description: 'Renders a NotificationButton (bell + count) opening a panel of these entries.',
            },
            {
              name: 'onNotificationsExportClick',
              type: '() => void',
              default: 'undefined',
              description: "Fires from the notification panel's \"Export history\" link.",
            },
            {
              name: 'mini',
              type: 'boolean',
              default: 'false',
              description:
                'Renders a 64px vertical icon rail instead of the 58px bar - same role/state, tooltips replace labels. Give it h-full from the layout, in place of the full bar.',
            },
          ]}
        />
      </DocSection>

      <DocSection title="Usage">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-paragraph-sm text-text-muted marker:text-text-disabled">
          <li>
            Always the first child of <InlineCode>AppShell</InlineCode>; the content
            panel floats below it (see Page shell).
          </li>
          <li>
            Sub-components <InlineCode>AppBarNavItem</InlineCode>,{' '}
            <InlineCode>WalletButton</InlineCode>, <InlineCode>AiButton</InlineCode>,{' '}
            <InlineCode>NotificationButton</InlineCode> are exported for custom compositions.
          </li>
          <li>
            With <InlineCode>mini</InlineCode>, <InlineCode>AppShell</InlineCode> becomes a row
            (rail + <InlineCode>MainLayout</InlineCode>) instead of a column (bar over{' '}
            <InlineCode>MainLayout</InlineCode>) - the rail takes over the full height AppBar
            used to sit above.
          </li>
        </ul>
      </DocSection>
    </DocPage>
  )
}
