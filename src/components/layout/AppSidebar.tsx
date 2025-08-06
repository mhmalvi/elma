import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Mic,
  Volume2,
  TestTube,
  Plus,
  Archive,
  Trash2,
  MoreHorizontal,
  Zap
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
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

const voiceNavItems = [
  { title: 'Voice Test', url: '/voice-test', icon: TestTube, badge: 'Beta' },
  { title: 'Voice Quality', url: '/voice-quality', icon: Volume2, badge: null },
  { title: 'Performance', url: '/performance', icon: Zap, badge: null },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { user } = useAuth();
  const { conversations, startNewConversation, deleteConversation } = useConversations();
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

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "glass-strong border-r border-sidebar-border bg-sidebar/95 backdrop-blur-xl transition-all duration-300"
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-lg",
            !collapsed && "shadow-primary/20"
          )}>
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-sidebar-foreground">AirChatBot</h2>
              <p className="text-xs text-sidebar-foreground/60">Islamic AI Assistant</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1 p-3 space-y-4">
        {/* New Chat Button */}
        <div>
          <Button 
            onClick={handleNewChat}
            className={cn(
              "w-full justify-start gap-3 h-11 font-medium bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground shadow-lg hover-lift",
              collapsed && "w-11 h-11 p-0 justify-center"
            )}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && "New Chat"}
          </Button>
        </div>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <div className="flex items-center justify-between mb-2">
                <SidebarGroupLabel className="text-sidebar-foreground/80 font-medium">Recent Chats</SidebarGroupLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-sidebar-accent"
                  onClick={() => setShowAllConversations(!showAllConversations)}
                >
                  {showAllConversations ? <Archive className="h-3 w-3" /> : <MoreHorizontal className="h-3 w-3" />}
                </Button>
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {recentConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton asChild className="group">
                      <NavLink 
                        to={`/chat?id=${conversation.id}`}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          "data-[active]:bg-sidebar-primary data-[active]:text-sidebar-primary-foreground"
                        )}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0 opacity-70" />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-sm font-medium">
                              {conversation.title || 'New Conversation'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
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
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/80 font-medium">Voice Features</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {voiceNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "data-[active]:bg-sidebar-primary data-[active]:text-sidebar-primary-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4 opacity-70" />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span className="text-sm font-medium">{item.title}</span>
                          {item.badge && (
                            <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
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
      </SidebarContent>
      
      {/* User Profile Footer - Minimal and Clean */}
      {user && !collapsed && (
        <div className="border-t border-sidebar-border/50 p-4">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">
                {user.user_metadata?.display_name || user.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                Islamic AI Assistant
              </p>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  );
}