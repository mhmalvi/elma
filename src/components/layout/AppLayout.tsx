import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');
  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // This will be handled by the sidebar search trigger
        const searchEvent = new CustomEvent('open-global-search');
        window.dispatchEvent(searchEvent);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {!isChatRoute && <AppSidebar />}
        
        <div className="flex-1 flex flex-col min-w-0">
          {!isChatRoute && (
            <header className="sticky top-0 z-40 h-14 border-b border-border/30 bg-background/95 backdrop-blur-xl">
              <div className="flex items-center h-full px-4">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors p-2 rounded-lg" />
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}