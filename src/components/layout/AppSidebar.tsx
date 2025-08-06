import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Mic,
  Volume2,
  TestTube,
  Plus,
  Archive,
  Trash2,
  MoreHorizontal,
  Zap,
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  Bookmark,
  Shield,
  Home
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
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

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border bg-sidebar backdrop-blur-xl transition-all duration-300",
        "w-80 data-[state=collapsed]:w-16"
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg hover-lift",
            !collapsed && "shadow-primary/20"
          )}>
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base gradient-neon bg-clip-text text-transparent">AirChatBot</h2>
              <p className="text-xs text-sidebar-foreground/70 font-medium">Islamic AI Assistant</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-4 space-y-6">
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleNewChat}
            className={cn(
              "w-full justify-start gap-3 h-12 font-semibold bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg hover-lift rounded-xl text-white border-2 border-teal-400",
              collapsed && "w-12 h-12 p-0 justify-center"
            )}
          >
            <Plus className="h-5 w-5 text-white" />
            {!collapsed && <span className="text-white font-semibold">New Chat</span>}
          </Button>

          {/* Search Button */}
          <Button
            variant="outline"
            onClick={() => setSearchOpen(true)}
            className={cn(
              "w-full justify-start gap-3 h-10 hover-lift rounded-lg",
              collapsed && "w-10 h-10 p-0 justify-center"
            )}
          >
            <Search className="h-4 w-4" />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1">
                <span>Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            )}
          </Button>

          {/* Quick Actions */}
          {!collapsed && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="flex-1 hover-lift"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/bookmarks')}
                className="flex-1 hover-lift"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <NotificationSystem />
            </div>
          )}
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
                          "w-full justify-start gap-3 h-auto p-3 rounded-xl transition-all duration-200 hover-lift",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          collapsed && "w-12 h-12 p-0 justify-center"
                        )}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0 text-sidebar-primary" />
                        {!collapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className="truncate text-sm font-medium text-sidebar-foreground">
                              {conversation.title || 'New Conversation'}
                            </div>
                            <div className="text-xs text-sidebar-foreground/60">
                              {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                            </div>
                          </div>
                        )}
                      </Button>
                      {!collapsed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-lg"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
      
      {/* User Profile Footer - Modern with Dropdown */}
      {user && (
        <div className="border-t border-sidebar-border/50 p-4">
          {!collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent/50 transition-all duration-200 cursor-pointer group hover-lift">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-sidebar-foreground">
                      {user.user_metadata?.display_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {isMasterAdmin() ? 'Master Admin' : 'User'}
                    </p>
                  </div>
                  <Settings className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
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
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20 hover-lift cursor-pointer">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                      {user.email?.charAt(0).toUpperCase()}
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