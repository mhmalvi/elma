import { useState, useEffect } from 'react';
import { Bell, Send, Users, Settings, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  type: 'daily_reminder' | 'prayer_time' | 'quote' | 'custom';
  is_active: boolean;
  schedule?: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  is_active: boolean;
  created_at: string;
}

export const PushNotificationSystem = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    title: '',
    body: '',
    type: 'custom' as const,
    schedule: ''
  });
  const { toast } = useToast();

  // Pre-defined Islamic notification templates
  const defaultTemplates: NotificationTemplate[] = [
    {
      id: 'template-1',
      name: 'Daily Dhikr Reminder',
      title: 'Time for Dhikr 🤲',
      body: 'Remember Allah with gratitude. SubhanAllah, Alhamdulillah, Allahu Akbar',
      type: 'daily_reminder',
      is_active: true,
      schedule: '08:00'
    },
    {
      id: 'template-2',
      name: 'Evening Reflection',
      title: 'Evening Reflection 🌙',
      body: 'Reflect on your day and seek forgiveness. May Allah bless your night.',
      type: 'daily_reminder',
      is_active: true,
      schedule: '20:00'
    },
    {
      id: 'template-3',
      name: 'Daily Quran Verse',
      title: 'Daily Wisdom 📖',
      body: 'Discover today\'s verse from the Quran. Tap to read and reflect.',
      type: 'quote',
      is_active: true,
      schedule: '12:00'
    },
    {
      id: 'template-4',
      name: 'Prayer Time Reminder',
      title: 'Prayer Time ⏰',
      body: 'It\'s time for prayer. May Allah accept your worship.',
      type: 'prayer_time',
      is_active: false,
      schedule: 'dynamic'
    }
  ];

  useEffect(() => {
    // Initialize with default templates
    setTemplates(defaultTemplates);
    
    // Mock subscription data
    setSubscriptions([
      {
        id: 'sub-1',
        user_id: 'user-1',
        endpoint: 'https://fcm.googleapis.com/fcm/send/...',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'sub-2',
        user_id: 'user-2',
        endpoint: 'https://fcm.googleapis.com/fcm/send/...',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]);
    
    setLoading(false);
  }, []);

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.title || !newTemplate.body) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const template: NotificationTemplate = {
      id: `template-${Date.now()}`,
      ...newTemplate,
      is_active: true
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: '', title: '', body: '', type: 'custom', schedule: '' });
    
    toast({
      title: 'Template Created',
      description: `Notification template "${newTemplate.name}" has been created.`
    });
  };

  const toggleTemplate = (templateId: string) => {
    setTemplates(templates.map(template => 
      template.id === templateId 
        ? { ...template, is_active: !template.is_active }
        : template
    ));
    
    toast({
      title: 'Template Updated',
      description: 'Template status has been updated.'
    });
  };

  const sendTestNotification = async (template: NotificationTemplate) => {
    // Mock sending notification
    toast({
      title: 'Test Notification Sent',
      description: `Test notification "${template.title}" sent to ${subscriptions.filter(s => s.is_active).length} subscribers.`
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'Push notifications have been enabled for this browser.'
        });
      } else {
        toast({
          title: 'Notifications Denied',
          description: 'Push notifications were denied. You can enable them in browser settings.',
          variant: 'destructive'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading push notification system...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notification System
          </h3>
          <p className="text-muted-foreground">Manage and send notifications to keep users engaged</p>
        </div>
        <Button onClick={requestNotificationPermission}>
          <Bell className="w-4 h-4 mr-2" />
          Test Permissions
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active Subscribers</p>
              <p className="text-2xl font-bold">{subscriptions.filter(s => s.is_active).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active Templates</p>
              <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Sent Today</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Delivery Rate</p>
              <p className="text-2xl font-bold">94%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create New Template */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Create Notification Template</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              placeholder="e.g., Morning Reminder"
            />
          </div>
          <div>
            <Label htmlFor="template-type">Type</Label>
            <select
              id="template-type"
              value={newTemplate.type}
              onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="custom">Custom</option>
              <option value="daily_reminder">Daily Reminder</option>
              <option value="prayer_time">Prayer Time</option>
              <option value="quote">Quote/Verse</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="template-title">Notification Title</Label>
            <Input
              id="template-title"
              value={newTemplate.title}
              onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
              placeholder="e.g., Time for Morning Dhikr 🌅"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="template-body">Notification Body</Label>
            <Textarea
              id="template-body"
              value={newTemplate.body}
              onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })}
              placeholder="e.g., Start your day with remembrance of Allah..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="template-schedule">Schedule (HH:MM or 'dynamic')</Label>
            <Input
              id="template-schedule"
              value={newTemplate.schedule}
              onChange={(e) => setNewTemplate({ ...newTemplate, schedule: e.target.value })}
              placeholder="e.g., 08:00 or dynamic"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreateTemplate} className="w-full">
              Create Template
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification Templates */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Notification Templates</h4>
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-2 ${template.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{template.name}</h5>
                    <Badge variant="outline">{template.type.replace('_', ' ')}</Badge>
                    {template.schedule && (
                      <Badge variant="secondary">{template.schedule}</Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm">{template.title}</p>
                  <p className="text-sm text-muted-foreground">{template.body}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendTestNotification(template)}
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Switch
                  checked={template.is_active}
                  onCheckedChange={() => toggleTemplate(template.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Subscriber Management */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Push Subscribers</h4>
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${subscription.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div>
                  <p className="font-medium">User {subscription.user_id}</p>
                  <p className="text-sm text-muted-foreground">
                    Subscribed: {new Date(subscription.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge variant={subscription.is_active ? "default" : "secondary"}>
                {subscription.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};