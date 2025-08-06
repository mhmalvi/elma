import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNavigation } from '@/components/ui/bottom-navigation'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children?: React.ReactNode
}

const routesWithoutBottomNav = ['/auth']

export const MobileLayout = ({ children }: MobileLayoutProps) => {
  const location = useLocation()
  const showBottomNav = !routesWithoutBottomNav.includes(location.pathname)

  return (
    <div className="relative min-h-screen bg-background">
      {/* Main Content */}
      <main className={cn(
        "relative",
        showBottomNav && "pb-20" // Space for bottom navigation
      )}>
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </div>
  )
}