import { useCallback, useEffect, useRef, useState } from 'react'

// Runs an async `load` function and tracks its result. It re-runs whenever
// `key` changes, or when reload() is called (e.g. after deleting something).
// While re-loading, the previous `data` stays available so lists don't flash.
export function useAsync(load, key) {
  const loadRef = useRef(load)
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState({ id: null, data: undefined, error: null })
  const id = `${key}#${version}`

  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    let ignore = false

    loadRef.current().then(
      (data) => {
        if (!ignore) setResult({ id, data, error: null })
      },
      (error) => {
        if (!ignore) setResult({ id, data: undefined, error: error.message ?? String(error) })
      },
    )

    return () => {
      ignore = true
    }
  }, [id])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return { data: result.data, error: result.error, loading: result.id !== id, reload }
}
