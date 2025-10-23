import * as React from "react"

export type ToastVariant = "default" | "success" | "error" | "warning"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  actions?: ToastAction[]
}

interface ToastState {
  toasts: Toast[]
}

type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "REMOVE_TOAST"; id: string }

let toastCount = 0

function generateId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE
  return toastCount.toString()
}

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      }
    default:
      return state
  }
}

const listeners: Array<(state: ToastState) => void> = []

let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast(props: Omit<Toast, "id">) {
  const id = generateId()

  const update = (props: Partial<Toast>) => {
    dispatch({ type: "ADD_TOAST", toast: { ...toast, ...props } as Toast })
  }

  const dismiss = () => dispatch({ type: "REMOVE_TOAST", id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      duration: props.duration ?? 5000,
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", id: toastId! }),
  }
}

export { useToast, toast }
