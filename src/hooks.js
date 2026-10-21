import { useEffect, useState } from 'react'
import { store } from './api'

// Re-run an async api call whenever the shop data changes (UI, agent or another tab).
export function useApi(fn, deps = [], initial = null) {
  const [data, setData] = useState(initial)
  const [tick, setTick] = useState(0)
  useEffect(() => store.subscribe(() => setTick((t) => t + 1)), [])
  useEffect(() => {
    let alive = true
    fn().then((d) => alive && setData(d))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])
  return data
}
