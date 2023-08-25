import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react'

export function useLocalStorage<T>(
  key: string,
  defaultState: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const value = localStorage.getItem(key)
      if (value) return JSON.parse(value) as T
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        console.error(error)
      }
    }

    return defaultState
  })
  const isFirstRenderRef = useRef(true)
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    try {
      if (state === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(state))
      }
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        console.error(error)
      }
    }
  }, [state, key])

  return [state, setState]
}
