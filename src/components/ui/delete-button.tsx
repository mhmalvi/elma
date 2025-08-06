import React from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const deleteButtonVariants = cva(
  "group relative overflow-hidden transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "hover:bg-destructive/10 text-muted-foreground hover:text-destructive border-transparent hover:border-destructive/20",
        subtle: "hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-600 dark:hover:text-red-400",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover:border-destructive",
        ghost: "hover:bg-destructive/5 text-muted-foreground hover:text-destructive",
        minimal: "hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground/60 hover:text-red-500 rounded-full"
      },
      size: {
        default: "h-9 w-9",
        sm: "h-8 w-8", 
        lg: "h-10 w-10",
        xs: "h-6 w-6"
      },
      iconStyle: {
        trash: "trash",
        x: "x"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      iconStyle: "trash"
    }
  }
);

interface DeleteButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof deleteButtonVariants> {
  onDelete?: () => void;
  loading?: boolean;
  confirmationRequired?: boolean;
  tooltip?: string;
}

export const DeleteButton = React.forwardRef<HTMLButtonElement, DeleteButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    iconStyle,
    onDelete, 
    loading = false,
    confirmationRequired = true,
    tooltip = "Delete",
    onClick,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      
      if (confirmationRequired) {
        const confirmed = window.confirm("Are you sure you want to delete this item?");
        if (!confirmed) return;
      }
      
      if (onDelete) {
        onDelete();
      } else if (onClick) {
        onClick(e);
      }
    };

    const IconComponent = iconStyle === 'x' ? X : Trash2;
    const iconSize = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4';

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(deleteButtonVariants({ variant, size }), className)}
        onClick={handleClick}
        disabled={loading}
        title={tooltip}
        {...props}
      >
        <div className="relative flex items-center justify-center">
          {/* Ripple effect background */}
          <div className="absolute inset-0 rounded-full bg-destructive/20 scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
          
          {/* Icon with micro-interactions */}
          <IconComponent 
            className={cn(
              iconSize,
              "relative z-10 transition-all duration-200 ease-out",
              "group-hover:scale-110 group-active:scale-95",
              loading && "animate-pulse"
            )} 
          />
          
          {/* Subtle glow effect on hover */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-400/0 to-red-600/0 group-hover:from-red-400/10 group-hover:to-red-600/10 transition-all duration-300" />
        </div>
        
        {/* Loading state overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <div className="w-3 h-3 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Button>
    );
  }
);

DeleteButton.displayName = "DeleteButton";

// Elegant delete button with icon and text
export const DeleteButtonWithText = React.forwardRef<HTMLButtonElement, DeleteButtonProps & { 
  children?: React.ReactNode;
  showIcon?: boolean;
}>(
  ({ 
    className, 
    variant = "subtle", 
    size = "default", 
    iconStyle,
    children = "Delete",
    showIcon = true,
    onDelete, 
    loading = false,
    confirmationRequired = true,
    onClick,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      
      if (confirmationRequired) {
        const confirmed = window.confirm("Are you sure you want to delete this item?");
        if (!confirmed) return;
      }
      
      if (onDelete) {
        onDelete();
      } else if (onClick) {
        onClick(e);
      }
    };

    const IconComponent = iconStyle === 'x' ? X : Trash2;

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          "group gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200",
          "border border-transparent hover:border-destructive/20",
          loading && "opacity-70 cursor-not-allowed",
          className
        )}
        onClick={handleClick}
        disabled={loading}
        {...props}
      >
        {showIcon && (
          <IconComponent className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
        )}
        <span className="transition-all duration-200">
          {loading ? "Deleting..." : children}
        </span>
        
        {loading && (
          <div className="w-3 h-3 border-2 border-destructive border-t-transparent rounded-full animate-spin ml-1" />
        )}
      </Button>
    );
  }
);

DeleteButtonWithText.displayName = "DeleteButtonWithText";