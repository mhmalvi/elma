import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Bookmark, 
  Settings, 
  User, 
  Home,
  History,
  Mic,
  Volume2,
  Download,
  BarChart3,
  Shield,
  Plus,
  Search,
  Archive,
  Trash2,
  Star,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { title: 'Chat', url: '/chat', icon: MessageSquare, badge: null },
  { title: 'Home', url: '/', icon: Home, badge: null },
  { title: 'Bookmarks', url: '/bookmarks', icon: Bookmark, badge: null },
  { title: 'Settings', url: '/settings', icon: Settings, badge: null },
];

const voiceNavItems = [
  { title: 'Voice Test', url: '/voice-test', icon: Mic, badge: 'Beta' },
  { title: 'Performance', url: '/performance', icon: Zap, badge: null },
  { title: 'Offline Content', url: '/offline', icon: Download, badge: null },
];

const adminNavItems = [
  { title: 'Admin Dashboard', url: '/admin', icon: Shield, badge: 'Admin' },
  { title: 'Analytics', url: '/analytics', icon: BarChart3, badge: null },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user, signOut } = useAuth();
  const { conversations, startNewConversation, deleteConversation } = useConversations();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [showAllConversations, setShowAllConversations] = useState(false);

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "transition-all duration-200 hover:bg-accent/50",
      isActive && "bg-accent text-accent-foreground font-medium"
    );

  const recentConversations = showAllConversations 
    ? conversations 
    : conversations.slice(0, 5);

  const handleNewChat = () => {
    startNewConversation();
    // Navigate to chat if not already there
    if (currentPath !== '/chat') {
      window.location.href = '/chat';
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "transition-all duration-300 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/src/assets/airchatbot-logo.png" alt="AirChatBot" />
            <AvatarFallback className="bg-primary text-primary-foreground">AC</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm truncate">AirChatBot</h2>
              <p className="text-xs text-muted-foreground truncate">Islamic AI Assistant</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-2">
        {/* New Chat Button */}
        <div className="mb-4">
          <Button 
            onClick={handleNewChat}
            className={cn(
              "w-full justify-start gap-2 mb-2 bg-primary hover:bg-primary/90",
              collapsed && "px-2"
            )}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && "New Chat"}
          </Button>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <div className="flex items-center justify-between">
                <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowAllConversations(!showAllConversations)}
                >
                  {showAllConversations ? <Archive className="h-3 w-3" /> : <History className="h-3 w-3" />}
                </Button>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {recentConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton asChild className="h-8 group">
                      <NavLink 
                        to={`/chat?id=${conversation.id}`}
                        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 flex-shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-sm">
                              {conversation.title || 'New Conversation'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                deleteConversation(conversation.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Voice Features */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Voice Features</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {voiceNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      className={getNavCls}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          {item.badge && (
                            <Badge variant="outline" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section (if user is admin) */}
        {user?.role === 'admin' && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Administration</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink 
                        to={item.url} 
                        className={getNavCls}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="destructive" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        {/* Theme Toggle */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={cn(
              "flex-1 justify-start gap-2",
              collapsed && "w-8 h-8 p-0"
            )}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
          </Button>
        </div>

        {/* User Profile */}
        {user && (
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer",
            collapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.display_name || user.email}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="h-6 p-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}