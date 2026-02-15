"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

const DialogContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
} | undefined>(undefined)

const Dialog = ({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }
  }

  const isControlled = open !== undefined
  const finalOpen = isControlled ? open : isOpen

  return (
    <DialogContext.Provider value={{ open: finalOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogTrigger used outside Dialog")

  return (
    <div onClick={() => context.onOpenChange(true)} className={className}>
      {children}
    </div>
  )
}

const DialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent used outside Dialog")
  
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted || !context.open) return null

  // Use Portal to render outside of container with overflow:hidden
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 relative ${className || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => context.onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
      {/* Background click to close */}
      <div className="absolute inset-0 -z-10" onClick={() => context.onOpenChange(false)} />
    </div>,
    document.body
  )
}

const DialogHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left p-6 ${className || ""}`} {...props}>
    {children}
  </div>
)

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0 ${className || ""}`}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter }
