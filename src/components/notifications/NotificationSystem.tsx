import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId?: string;
}

export const NotificationSystem = () => {
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
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="p-4 shadow-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read ? 'bg-muted/30' : 'bg-background'
                    } transition-colors`}
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
                            className="h-6 w-6 p-0"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};