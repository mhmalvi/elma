import React from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface WebLayoutProps {
  children: React.ReactNode
}

export const WebLayout = ({ children }: WebLayoutProps) => {
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  const isChatPage = location.pathname === '/chat'

  return (
    <div className={cn(
      "min-h-screen w-full relative",
      "bg-background text-foreground",
      isHomePage && "bg-gradient-to-br from-background via-background to-primary/5"
    )}>
      {/* Background grid pattern */}
      {!isHomePage && (
        <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />
      )}
      
      {/* Floating geometric shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-spiritual/10 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Aurora effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 animate-gradient opacity-50" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}