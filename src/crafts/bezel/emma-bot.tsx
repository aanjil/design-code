import { EmmaAvatar, type EmmaState } from '@/components/emma-avatar'
import type { BezelMode } from './floating-bezel'

/**
 * Emma's face in the Bezel - replaces the bar's status dot. Same job (is
 * Emma idle, attentive, or busy?), but it reads as *who* is talking, the
 * way an avatar does in a chat:
 *   quiet                 -> sleeping   (nothing needs you)
 *   scanning              -> thinking   (the ring orbits while she looks)
 *   run / acting          -> working    (a chase round the ring - in flight)
 *   voice / ask           -> listening
 *   tension               -> attention
 *   everything else       -> idle       (awake, watching your cursor)
 * Built in-house from the Emma mark (`components/emma-avatar`, see the
 * emma-avatar craft); honours prefers-reduced-motion.
 */

export function emmaStateFor(mode: BezelMode): EmmaState {
  if (mode === 'quiet') return 'sleeping'
  if (mode === 'scanning') return 'thinking'
  if (mode === 'run' || mode === 'acting') return 'working'
  if (mode === 'voice' || mode === 'ask') return 'listening'
  if (mode === 'tension') return 'attention'
  return 'idle'
}

export function EmmaBot({
  mode,
  state,
  size = 36,
  className,
}: {
  mode?: BezelMode
  /** Explicit state, when the caller isn't a Bezel mode (e.g. an agent step). */
  state?: EmmaState
  size?: number
  className?: string
}) {
  return (
    <span aria-hidden className={className} style={{ display: 'inline-flex', flexShrink: 0, width: size, height: size }}>
      <EmmaAvatar size={size} ground={false} state={state ?? (mode ? emmaStateFor(mode) : 'idle')} />
    </span>
  )
}
