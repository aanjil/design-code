import { EmployeesBezelScreen } from './employees-screen'
import { bezelStateFor } from './catalog'

/** The live, fully-interactive instance - real checkboxes drive the real
 *  bulk bar, the mic really opens voice, the claim really scans. */
export function LiveApp() {
  return <EmployeesBezelScreen initialMode="quiet" />
}

/** One frozen window per catalog state, for side-by-side design review -
 *  same component, seeded to a different starting point (multi-payroll's
 *  ScreenFrame pattern, collapsed to a single screen since every bezel
 *  state is the same page). */
export function ScreenFrame({ stateId }: { stateId: string }) {
  const state = bezelStateFor(stateId)
  return <EmployeesBezelScreen initialMode={state.mode} initialPins={state.pins ?? 0} interactive={false} />
}
