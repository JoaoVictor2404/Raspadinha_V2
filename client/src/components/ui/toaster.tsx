import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { ChevronRight } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={10000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} duration={10000} {...props}>
            {/* Indicador de Swipe - apenas mobile */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 md:hidden opacity-30">
              <ChevronRight className="h-4 w-4 animate-pulse" />
            </div>
            
            <div className="grid gap-1 ml-6 md:ml-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
