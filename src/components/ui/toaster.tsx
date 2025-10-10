"use client"

import { useEffect } from "react"
import { Toast } from "@/components/ui/toast"
import { useToast } from "@/lib/hooks/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => {
        return (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={dismiss}
          />
        )
      })}
    </div>
  )
}

interface ToastItemProps {
  id: string
  message: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
  onDismiss: (id: string) => void
}

function ToastItem({ id, message, variant, duration, onDismiss }: ToastItemProps) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onDismiss(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onDismiss])

  return (
    <Toast
      variant={variant}
      onClose={() => onDismiss(id)}
      className="mb-2"
    >
      {message}
    </Toast>
  )
}
