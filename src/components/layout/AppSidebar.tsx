import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus,
  Archive,
  MoreHorizontal,
  Settings,
  Search,
  Moon,
  Sun,
  Bookmark,
  Shield,
  Home,
  ChevronRight,
  Bot
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DeleteButton } from '@/components/ui/delete-button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import { useRole } from '@/hooks/useRole';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { NotificationSystem } from '@/components/notifications/NotificationSystem';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Remove voice features from sidebar - they'll be in settings now

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isMasterAdmin } = useRole();
  const { conversations, startNewConversation, deleteConversation, selectConversation } = useConversationsContext();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  
  const [showAllConversations, setShowAllConversations] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Listen for global search keyboard shortcut
  React.useEffect(() => {
    const handleGlobalSearch = () => setSearchOpen(true);
    window.addEventListener('open-global-search', handleGlobalSearch);
    return () => window.removeEventListener('open-global-search', handleGlobalSearch);
  }, []);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "transition-all duration-200 hover:bg-sidebar-accent/50 rounded-lg",
      isActive && "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
    );

  const recentConversations = showAllConversations 
    ? conversations 
    : conversations.slice(0, 8);

  const handleNewChat = async () => {
    console.log('NEW CHAT CLICKED - Starting new conversation');
    await startNewConversation();
    console.log('NEW CHAT - startNewConversation completed');
    // Navigate to chat if not already there
    if (currentPath !== '/chat') {
      console.log('NEW CHAT - Navigating to /chat');
      navigate('/chat');
    } else {
      console.log('NEW CHAT - Already on /chat');
    }
  };

  const handleConversationClick = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      await selectConversation(conversation);
      if (currentPath !== '/chat') {
        navigate('/chat');
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogoClick = () => {
    // Role-based routing
    if (isMasterAdmin()) {
      navigate('/admin');
    } else {
      navigate('/chat');
    }
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-all duration-300",
        "w-80 data-[state=collapsed]:w-16 min-w-16"
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border/50 p-3">
        <button
          onClick={handleLogoClick}
          className={cn(
            "flex items-center gap-3 w-full rounded-xl transition-all duration-300 group",
            "hover:bg-sidebar-accent/50 hover:scale-[1.02] active:scale-[0.98]",
            collapsed ? "justify-center p-2" : "p-3"
          )}
        >
          <div className={cn(
            "rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg",
            "transition-all duration-300 group-hover:shadow-primary/30 group-hover:scale-110",
            collapsed ? "h-8 w-8" : "h-10 w-10",
            !collapsed && "shadow-primary/20"
          )}>
            <Bot className={cn(
              "text-primary-foreground transition-transform duration-300 group-hover:rotate-12",
              collapsed ? "h-4 w-4" : "h-5 w-5"
            )} />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <h2 className="font-bold text-base gradient-neon bg-clip-text text-transparent transition-all duration-300">
                  AirChatBot
                </h2>
                <p className="text-xs text-sidebar-foreground/70 font-medium transition-all duration-300 group-hover:text-sidebar-foreground/90">
                  Islamic AI Assistant
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-sidebar-foreground/50 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
            </>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className={cn("flex-1 space-y-4", collapsed ? "p-2" : "p-4")}>
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleNewChat}
            className={cn(
              "w-full font-semibold bg-gradient-primary hover:bg-gradient-primary/90",
              "shadow-lg hover:shadow-primary/30 rounded-xl text-white border border-primary/20",
              "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover-lift group",
              collapsed ? "h-10 w-10 p-0 justify-center" : "justify-start gap-3 h-12"
            )}
            title={collapsed ? "New Chat" : undefined}
          >
            <Plus className={cn(
              "text-white transition-transform duration-300 group-hover:rotate-90",
              collapsed ? "h-4 w-4" : "h-5 w-5"
            )} />
            {!collapsed && <span className="text-white font-semibold">New Chat</span>}
          </Button>

          {/* Search Button */}
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "w-full rounded-lg border-sidebar-border/50 group",
              "hover:bg-sidebar-accent hover:border-primary/20 transition-all duration-300",
              "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]",
              collapsed ? "h-10 w-10 p-0 justify-center" : "justify-start gap-3 h-10"
            )}
            title={collapsed ? "Search (⌘K)" : undefined}
          >
            <Search className={cn(
              "text-sidebar-foreground/70 group-hover:text-primary transition-colors duration-300",
              collapsed ? "h-4 w-4" : "h-4 w-4"
            )} />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-sidebar-foreground group-hover:text-sidebar-foreground transition-colors duration-300">Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground transition-colors duration-300 group-hover:border-primary/20">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            )}
          </Button>

          {/* Quick Actions */}
          <div className={cn(
            "grid gap-2 transition-all duration-300",
            collapsed ? "grid-cols-1 space-y-1" : "grid-cols-3"
          )}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "hover-lift rounded-lg transition-all duration-300 group relative overflow-hidden",
                "hover:bg-sidebar-accent hover:shadow-sm hover:scale-105 active:scale-95",
                collapsed ? "w-10 h-10 p-0 mx-auto" : "min-h-10"
              )}
              title={collapsed ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : undefined}
            >
              <div className="relative z-10">
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-primary transition-all duration-500 group-hover:rotate-180 group-hover:scale-110" />
                ) : (
                  <Moon className="h-4 w-4 text-primary transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                )}
              </div>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bookmarks')}
              className={cn(
                "hover-lift rounded-lg transition-all duration-300 group",
                "hover:bg-sidebar-accent hover:shadow-sm hover:scale-105 active:scale-95",
                collapsed ? "w-10 h-10 p-0 mx-auto" : "min-h-10"
              )}
              title={collapsed ? 'Bookmarks' : undefined}
            >
              <Bookmark className="h-4 w-4 text-primary transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12" />
            </Button>
            
            <div className={cn(
              "flex justify-center items-center",
              collapsed ? "mx-auto" : "min-h-10"
            )}>
              <NotificationSystem collapsed={collapsed} />
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <div className="flex items-center justify-between mb-4">
                <SidebarGroupLabel className="text-sidebar-foreground font-semibold text-sm">Recent Chats</SidebarGroupLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-sidebar-accent rounded-lg"
                  onClick={() => setShowAllConversations(!showAllConversations)}
                >
                  {showAllConversations ? <Archive className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {recentConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <div className="group relative">
                        <Button
                          variant="ghost"
                          onClick={() => handleConversationClick(conversation.id)}
                          className={cn(
                            "w-full transition-all duration-300 hover-lift group",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm",
                            "hover:scale-[1.02] active:scale-[0.98] rounded-xl",
                            collapsed ? "h-10 w-10 p-0 justify-center" : "justify-start gap-3 h-auto p-3"
                          )}
                          title={collapsed ? (conversation.title || 'New Conversation') : undefined}
                        >
                          <MessageSquare className={cn(
                            "flex-shrink-0 text-primary transition-all duration-300 group-hover:scale-110",
                            collapsed ? "h-4 w-4" : "h-4 w-4"
                          )} />
                          {!collapsed && (
                            <div className="flex-1 text-left min-w-0">
                              <div className="truncate text-sm font-medium text-sidebar-foreground transition-colors duration-300">
                                {conversation.title || 'New Conversation'}
                              </div>
                              <div className="text-xs text-sidebar-foreground/60 transition-colors duration-300 group-hover:text-sidebar-foreground/80">
                                {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                              </div>
                            </div>
                          )}
                        </Button>
                      {!collapsed && (
                        <DeleteButton
                          variant="minimal" 
                          size="xs"
                          iconStyle="xcircle"
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                          onDelete={() => deleteConversation(conversation.id)}
                          confirmationRequired={true}
                          tooltip="Remove conversation"
                        />
                      )}
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
      
      {/* User Profile Footer */}
      {user && (
        <div className={cn("border-t border-sidebar-border/50", collapsed ? "p-2" : "p-4")}>
          {!collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={cn(
                  "flex items-center rounded-xl hover:bg-sidebar-accent/50 transition-all duration-300 cursor-pointer group hover-lift hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]",
                  collapsed ? "justify-center p-2" : "gap-3 p-3"
                )}>
                  <Avatar className={cn(
                    "ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105",
                    collapsed ? "h-8 w-8" : "h-10 w-10"
                  )}>
                    <AvatarImage src={profile?.avatar_url} className="transition-all duration-300" />
                    <AvatarFallback className={cn(
                      "bg-gradient-primary text-primary-foreground font-bold transition-all duration-300 group-hover:scale-110",
                      collapsed ? "text-xs" : "text-sm"
                    )}>
                      {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-sidebar-foreground transition-colors duration-300">
                          {profile?.display_name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-sidebar-foreground/60 truncate transition-colors duration-300 group-hover:text-sidebar-foreground/80">
                          {isMasterAdmin() ? 'Master Admin' : 'User'}
                        </p>
                      </div>
                      <Settings className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-90 text-primary" />
                    </>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Avatar className="h-4 w-4 mr-2">
                    <AvatarFallback className="text-xs">P</AvatarFallback>
                  </Avatar>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/bookmarks')}>
                  <Bookmark className="h-4 w-4 mr-2" />
                  My Bookmarks
                </DropdownMenuItem>
                {isMasterAdmin() && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex justify-center">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover-lift cursor-pointer transition-all duration-300 hover:ring-primary/40 hover:scale-110 active:scale-95 hover:shadow-lg">
                    <AvatarImage src={profile?.avatar_url} className="transition-all duration-300" />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-bold transition-all duration-300 hover:scale-110">
                      {profile?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
      
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </Sidebar>
  );
}