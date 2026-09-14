import { useEffect, useRef, useState } from 'react'

/**
 * Mocked AI effects for the Grain component - a claim streaming in like a
 * live answer, and a live undo/expiry countdown. Both are deterministic
 * (no randomness) so docs specimens stay stable.
 */

export function useCountdown(seconds: number | undefined, onExpire?: () => void) {
  const [remaining, setRemaining] = useState(seconds ?? 0)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    setRemaining(seconds ?? 0)
    if (!seconds) return
    const id = setInterval(() => {
      setRemaining((n) => (n <= 1 ? 0 : n - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [seconds])

  // Fires onExpire as its own effect rather than inside the setRemaining
  // updater above - updater functions must stay pure (React may invoke
  // them outside a commit to check for bail-out), so a side effect there
  // trips "Cannot update a component while rendering a different one."
  useEffect(() => {
    if (seconds && remaining === 0) onExpireRef.current?.()
  }, [seconds, remaining])

  return remaining
}

/** Reveals `text` character by character, at `msPerChar`. Restarts whenever
 *  `text` or `active` changes so replaying a scenario replays the stream. */
export function useStreamedText(text: string, active: boolean, msPerChar = 22) {
  const [length, setLength] = useState(active ? 0 : text.length)

  useEffect(() => {
    if (!active) {
      setLength(text.length)
      return
    }
    setLength(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setLength(i)
      if (i >= text.length) clearInterval(id)
    }, msPerChar)
    return () => clearInterval(id)
  }, [text, active, msPerChar])

  return {
    visible: text.slice(0, length),
    done: length >= text.length,
  }
}
