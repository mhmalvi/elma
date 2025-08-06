import * as React from "react"
import { Home, MessageCircle, Bookmark, Settings, Star } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const navigationItems = [
  { 
    icon: Home, 
    label: "Home", 
    path: "/" 
  },
  { 
    icon: MessageCircle, 
    label: "Chat", 
    path: "/chat" 
  },
  { 
    icon: Bookmark, 
    label: "Bookmarks", 
    path: "/bookmarks" 
  },
  { 
    icon: Settings, 
    label: "Settings", 
    path: "/settings" 
  }
]

export const BottomNavigation = () => {
  const location = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300",
                "hover:bg-muted/50 active:scale-95",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative p-2 rounded-full transition-all duration-300",
                isActive && "scale-110"
              )}>
                {isActive && (
                  <div className="absolute inset-0 primary-gradient rounded-full opacity-20 animate-pulse" />
                )}
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "text-primary"
                  )} 
                />
                {isActive && (
                  <div className="absolute -top-1 -right-1">
                    <Star className="w-2 h-2 text-spiritual fill-current animate-pulse" />
                  </div>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium mt-1 transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}