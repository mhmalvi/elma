import * as React from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  itemType?: string
  destructive?: boolean
}

export const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemType = "item",
  destructive = true
}: DeleteConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] border-border/50 bg-background/95 backdrop-blur-xl">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-full p-3 transition-all duration-300",
              destructive 
                ? "bg-destructive/10 text-destructive"
                : "bg-muted text-muted-foreground"
            )}>
              {destructive ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-foreground">
              {title || `Delete ${itemType}?`}
            </AlertDialogTitle>
          </div>
          
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            {description || `Are you sure you want to delete this ${itemType}? This action cannot be undone and the ${itemType} will be permanently removed.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              className="hover:bg-muted/50 border-border/50"
            >
              Cancel
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button
              variant={destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              className={cn(
                "transition-all duration-300",
                destructive && "hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25"
              )}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {itemType}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}