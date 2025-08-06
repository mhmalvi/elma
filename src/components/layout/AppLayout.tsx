import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Search, Bell, Menu, Home, Settings, Bookmark, Shield, BarChart3, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Bookmarks', url: '/bookmarks', icon: Bookmark },
    { title: 'Settings', url: '/settings', icon: Settings },
  ];

  const adminNavItems = [
    { title: 'Admin', url: '/admin', icon: Shield },
    { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Modern Top Navigation Bar */}
          <header className="sticky top-0 z-40 h-16 border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors p-2 rounded-lg" />
                <div className="hidden sm:flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg">
                    <span className="text-primary-foreground font-bold text-sm">AC</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-lg gradient-neon bg-clip-text text-transparent">AirChatBot</h1>
                    <p className="text-xs text-muted-foreground">Islamic AI Assistant</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={({ isActive }) => cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.title}</span>
                  </NavLink>
                ))}
                
                {user?.role === 'admin' && adminNavItems.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    className={({ isActive }) => cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-destructive text-destructive-foreground shadow-lg" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.title}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {/* Search Button */}
                <Button variant="ghost" size="sm" className="hidden lg:flex gap-2 px-3">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                  <kbd className="h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium hidden xl:inline-flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative p-2 rounded-lg">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                  {/* Notification dot */}
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse"></span>
                </Button>

                {/* Sign Out - Desktop */}
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="hidden md:flex text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sign out
                  </Button>
                )}

                {/* Mobile menu trigger */}
                <Button variant="ghost" size="sm" className="md:hidden p-2">
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}