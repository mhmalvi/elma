import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Search, Bell, Menu, Home, Settings, Bookmark, Shield, BarChart3, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Minimal Top Header */}
          <header className="sticky top-0 z-40 h-16 border-b border-border/30 bg-background/95 backdrop-blur-xl">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground transition-colors p-2 rounded-lg" />
              </div>

              <div className="flex items-center gap-3">
                {/* Search Button */}
                <Button variant="ghost" size="sm" className="hidden lg:flex gap-2 px-3 hover-lift">
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                  <kbd className="h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium hidden xl:inline-flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>

                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-accent transition-all duration-200 hover-lift"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative p-2 rounded-lg hover-lift">
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Notifications</span>
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse"></span>
                </Button>

                {/* User Menu */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 rounded-lg hover-lift">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.user_metadata?.avatar_url} />
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <NavLink to="/" className="flex items-center">
                          <Home className="h-4 w-4 mr-2" />
                          Home
                        </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to="/bookmarks" className="flex items-center">
                          <Bookmark className="h-4 w-4 mr-2" />
                          Bookmarks
                        </NavLink>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <NavLink to="/settings" className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </NavLink>
                      </DropdownMenuItem>
                      {user?.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <NavLink to="/admin" className="flex items-center">
                              <Shield className="h-4 w-4 mr-2" />
                              Admin
                            </NavLink>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <NavLink to="/analytics" className="flex items-center">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </NavLink>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="text-destructive">
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
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