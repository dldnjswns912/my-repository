import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"
import { createContext, useContext, useState } from "react"

const ToastContext = createContext({
  toast: () => {},
  toasts: [],
  dismiss: () => {},
})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  let count = 0

  function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
  }

  const toast = ({ title, description, variant = "default", duration = 5000 }) => {
    const id = genId()

    // sonner toast ?�이브러�??�용
    sonnerToast(title, {
      description: description,
      duration: duration,
      id: id,
      className: variant ? `toast-${variant}` : '',
    })

    const newToast = {
      id,
      title,
      description,
      variant,
    }

    setToasts((prevToasts) => [...prevToasts, newToast])

    setTimeout(() => {
      dismiss(id)
    }, duration)

    return {
      id,
      dismiss: () => dismiss(id),
      update: (props) => update(id, props),
    }
  }

  const dismiss = (toastId) => {
    sonnerToast.dismiss(toastId)
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId))
  }

  const update = (toastId, props) => {
    setToasts((prevToasts) => prevToasts.map((toast) => (toast.id === toastId ? { ...toast, ...props } : toast)))
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      <SonnerToaster />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}
