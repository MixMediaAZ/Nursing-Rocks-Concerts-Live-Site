import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

// This is a customized version of the Dialog component that prevents automatic closing
// It only closes when explicitly told to do so through the Close button or programmatically

const PersistentDialog = DialogPrimitive.Root

const PersistentDialogTrigger = DialogPrimitive.Trigger

const PersistentDialogPortal = DialogPrimitive.Portal

const PersistentDialogClose = DialogPrimitive.Close

const PersistentDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
PersistentDialogOverlay.displayName = "PersistentDialogOverlay"

const PersistentDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
    onCloseButtonClick?: () => void;
  }
>(({ className, children, showCloseButton = true, onCloseButtonClick, ...props }, ref) => (
  <PersistentDialogPortal>
    <PersistentDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      onEscapeKeyDown={(e) => {
        // Prevent closing with ESC key
        e.preventDefault();
      }}
      onPointerDownOutside={(e) => {
        // Prevent closing when clicking outside
        e.preventDefault();
      }}
      onInteractOutside={(e) => {
        // Prevent closing when interacting outside
        e.preventDefault();
      }}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={onCloseButtonClick}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </PersistentDialogPortal>
))
PersistentDialogContent.displayName = "PersistentDialogContent"

const PersistentDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
PersistentDialogHeader.displayName = "PersistentDialogHeader"

const PersistentDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
PersistentDialogFooter.displayName = "PersistentDialogFooter"

const PersistentDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
PersistentDialogTitle.displayName = "PersistentDialogTitle"

const PersistentDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
PersistentDialogDescription.displayName = "PersistentDialogDescription"

export {
  PersistentDialog,
  PersistentDialogPortal,
  PersistentDialogOverlay,
  PersistentDialogClose,
  PersistentDialogTrigger,
  PersistentDialogContent,
  PersistentDialogHeader,
  PersistentDialogFooter,
  PersistentDialogTitle,
  PersistentDialogDescription,
}