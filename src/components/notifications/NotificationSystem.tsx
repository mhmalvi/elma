import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId?: string;
}

export const NotificationSystem = ({ collapsed = false }: { collapsed?: boolean }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Initialize notification system
  useEffect(() => {
    // Request notification permissions
    requestNotificationPermission();
    
    // Setup daily Islamic content notifications
    setupDailyNotifications();
    
    // Simulate some initial notifications for demo
    const initialNotifications: Notification[] = [
      {
        id: '1',
        title: 'Daily Verse',
        message: 'Today\'s Quranic verse is ready for you to explore.',
        type: 'info',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        title: 'System Update',
        message: 'Voice recognition has been improved for better accuracy.',
        type: 'success',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        read: false
      }
    ];
    
    setNotifications(initialNotifications);
    setUnreadCount(initialNotifications.filter(n => !n.read).length);
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive daily Islamic content and important updates."
        });
      }
    }
  };

  const setupDailyNotifications = () => {
    // Setup daily notification for Islamic content
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM next day

    const timeUntilTomorrow = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      sendDailyNotification();
      // Setup recurring daily notifications
      setInterval(sendDailyNotification, 24 * 60 * 60 * 1000); // Every 24 hours
    }, timeUntilTomorrow);
  };

  const sendDailyNotification = () => {
    const dailyNotification: Notification = {
      id: Date.now().toString(),
      title: 'Daily Islamic Content',
      message: 'Your daily Quranic verse and Hadith are ready to explore.',
      type: 'info',
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [dailyNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification(dailyNotification.title, {
        body: dailyNotification.message,
        icon: '/airchatbot-logo.png'
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-spiritual" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative hover:bg-sidebar-accent hover:text-primary transition-all duration-300",
          "hover:scale-105 active:scale-95 rounded-lg",
          collapsed ? "w-10 h-10 p-0" : "p-2"
        )}
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-primary transition-all duration-300 hover:rotate-12" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center bg-primary text-primary-foreground border-none animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)}>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          />
          
          {/* Notification panel positioned from the right */}
          <div 
            className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-background/95 backdrop-blur-xl border-l shadow-2xl animate-slide-in-right overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-card/50">
                <h3 className="font-semibold text-card-foreground">Notifications</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-sidebar-accent rounded-lg transition-all duration-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.read ? 'bg-muted/30' : 'bg-background'
                        } transition-colors hover:bg-sidebar-accent/50`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            {getIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {notification.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0 hover:bg-primary/20"
                                title="Mark as read"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 w-6 p-0 hover:bg-destructive/20"
                              title="Delete"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};