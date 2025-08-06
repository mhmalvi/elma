import React from 'react';
import { Minus, XCircle, Archive, Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const deleteButtonVariants = cva(
  "group relative overflow-hidden transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "hover:bg-orange-50 dark:hover:bg-orange-950/20 text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 border-transparent hover:border-orange-200 dark:hover:border-orange-800",
        subtle: "hover:bg-rose-50 dark:hover:bg-rose-950/10 text-muted-foreground hover:text-rose-500 dark:hover:text-rose-400 border-transparent hover:border-rose-100 dark:hover:border-rose-900",
        destructive: "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700",
        ghost: "hover:bg-amber-50 dark:hover:bg-amber-950/10 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400",
        minimal: "hover:bg-gray-50 dark:hover:bg-gray-900/20 text-muted-foreground/60 hover:text-gray-600 dark:hover:text-gray-400 rounded-full"
      },
      size: {
        default: "h-9 w-9",
        sm: "h-8 w-8", 
        lg: "h-10 w-10",
        xs: "h-6 w-6"
      },
      iconStyle: {
        minus: "minus",
        xcircle: "xcircle", 
        archive: "archive",
        hide: "hide"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      iconStyle: "minus"
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

    const getIconComponent = () => {
      switch (iconStyle) {
        case 'xcircle':
          return XCircle;
        case 'archive':
          return Archive;
        case 'hide':
          return EyeOff;
        default:
          return Minus;
      }
    };

    const IconComponent = getIconComponent();
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
          {/* Animated background with gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200/0 via-red-200/0 to-pink-200/0 group-hover:from-orange-200/30 group-hover:via-red-200/20 group-hover:to-pink-200/30 dark:group-hover:from-orange-900/20 dark:group-hover:via-red-900/15 dark:group-hover:to-pink-900/20 scale-0 group-hover:scale-100 transition-all duration-500 ease-out" />
          
          {/* Icon with enhanced micro-interactions */}
          <IconComponent 
            className={cn(
              iconSize,
              "relative z-10 transition-all duration-300 ease-out",
              "group-hover:scale-125 group-active:scale-95 group-hover:rotate-12",
              loading && "animate-pulse"
            )} 
          />
          
          {/* Multi-layered glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/0 via-orange-400/0 to-red-400/0 group-hover:from-amber-400/15 group-hover:via-orange-400/10 group-hover:to-red-400/15 transition-all duration-500" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/0 to-red-500/0 group-hover:from-yellow-300/5 group-hover:to-red-500/10 transition-all duration-700 delay-100" />
        </div>
        
        {/* Loading state overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-full backdrop-blur-sm">
            <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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

    const getIconComponent = () => {
      switch (iconStyle) {
        case 'xcircle':
          return XCircle;
        case 'archive':
          return Archive;
        case 'hide':
          return EyeOff;
        default:
          return Minus;
      }
    };

    const IconComponent = getIconComponent();

    return (
      <Button
        ref={ref}
        variant="ghost"
        className={cn(
          "group gap-2 text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/10 transition-all duration-300",
          "border border-transparent hover:border-orange-200 dark:hover:border-orange-800 rounded-lg",
          loading && "opacity-70 cursor-not-allowed",
          className
        )}
        onClick={handleClick}
        disabled={loading}
        {...props}
      >
        {showIcon && (
          <IconComponent className="w-4 h-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
        )}
        <span className="transition-all duration-300 group-hover:tracking-wide">
          {loading ? "Deleting..." : children}
        </span>
        
        {loading && (
          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin ml-1" />
        )}
      </Button>
    );
  }
);

DeleteButtonWithText.displayName = "DeleteButtonWithText";