import { DEFAULT_DISPLAY, EmployeesPage } from './employees-page'
import { CanvasExperiment } from '@/components/playground/canvas-experiment'
import { makeCondition } from '@/components/nds/filters/types'

/**
 * Filter-centric exploration of the Employees page. Each browser window
 * is the same page in a different use-case state — drag/resize to compare.
 * Full-viewport canvas; chrome lives in the floating dock (top-left).
 */
export function EmployeeFilters() {
  return (
    <CanvasExperiment
      slug="employee-filters"
      windows={[
        {
          id: 'default',
          title: 'Default — no filters',
          url: 'nexus.niural.com/people/employees',
          x: 700,
          y: 420,
          width: 1512,
          height: 910,
          content: <EmployeesPage />,
        },
        {
          id: 'applied',
          title: 'Applied — editable filter chips',
          url: 'nexus.niural.com/people/employees?filter=job-title',
          x: 1244,
          y: 745,
          width: 1512,
          height: 910,
          content: (
            <EmployeesPage
              initialConditions={[
                makeCondition('job-title', ['Account Executive']),
              ]}
            />
          ),
        },
        {
          id: 'display',
          title: 'Display — grouped by location',
          url: 'nexus.niural.com/people/employees?view=by-location',
          x: 1788,
          y: 1070,
          width: 1512,
          height: 910,
          content: (
            <EmployeesPage
              initialDisplay={{
                ...DEFAULT_DISPLAY,
                groupBy: 'work-location',
                visibleColumns: [
                  'name',
                  'jobTitle',
                  'workLocation',
                  'status',
                  'compensation',
                ],
              }}
            />
          ),
        },
      ]}
    />
  )
}
