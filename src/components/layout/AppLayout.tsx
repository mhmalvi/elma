import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Search, Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="sticky top-0 z-40 h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between h-full px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors" />
                <div className="hidden sm:flex items-center gap-2">
                  <h1 className="font-semibold text-lg">AirChatBot</h1>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Islamic AI Assistant
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Button */}
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline">Search</span>
                  <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                  {/* Notification dot */}
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>

                {/* Mobile menu trigger */}
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}