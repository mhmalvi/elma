import { useState, useEffect } from 'react';
import { Share, Link, Copy, QrCode, Users, Eye, Download, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SharedConversation {
  id: string;
  conversation_id: string;
  title: string;
  share_token: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  expires_at?: string;
  created_by: string;
}

interface ShareSettings {
  allow_public_sharing: boolean;
  require_authentication: boolean;
  default_expiry_days: number;
  max_views: number;
}

export const ConversationSharingSystem = () => {
  const [sharedConversations, setSharedConversations] = useState<SharedConversation[]>([]);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    allow_public_sharing: true,
    require_authentication: false,
    default_expiry_days: 30,
    max_views: 1000
  });
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Mock shared conversations data
    const mockSharedConversations: SharedConversation[] = [
      {
        id: 'share-1',
        conversation_id: 'conv-1',
        title: 'Guidance on Daily Prayers',
        share_token: 'abc123def456',
        is_public: true,
        view_count: 47,
        created_at: '2025-01-01T10:00:00Z',
        expires_at: '2025-02-01T10:00:00Z',
        created_by: 'user-1'
      },
      {
        id: 'share-2',
        conversation_id: 'conv-2',
        title: 'Understanding Zakat Calculations',
        share_token: 'xyz789ghi012',
        is_public: true,
        view_count: 23,
        created_at: '2025-01-02T15:30:00Z',
        expires_at: '2025-02-02T15:30:00Z',
        created_by: 'user-2'
      },
      {
        id: 'share-3',
        conversation_id: 'conv-3',
        title: 'Quran Recitation Tips',
        share_token: 'mno345pqr678',
        is_public: false,
        view_count: 12,
        created_at: '2025-01-03T08:15:00Z',
        created_by: 'user-1'
      }
    ];

    setSharedConversations(mockSharedConversations);
    setLoading(false);
  }, []);

  const generateShareLink = (shareToken: string, isPublic: boolean) => {
    const baseUrl = window.location.origin;
    if (isPublic) {
      return `${baseUrl}/shared/${shareToken}`;
    }
    return `${baseUrl}/shared/${shareToken}?private=true`;
  };

  const copyShareLink = async (shareToken: string, isPublic: boolean) => {
    const shareLink = generateShareLink(shareToken, isPublic);
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: 'Link Copied',
        description: 'Share link has been copied to clipboard.'
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive'
      });
    }
  };

  const createNewShare = () => {
    if (!selectedConversation) {
      toast({
        title: 'Error',
        description: 'Please select a conversation to share.',
        variant: 'destructive'
      });
      return;
    }

    const newShare: SharedConversation = {
      id: `share-${Date.now()}`,
      conversation_id: selectedConversation,
      title: `Shared Conversation ${Date.now()}`,
      share_token: Math.random().toString(36).substring(2, 15),
      is_public: shareSettings.allow_public_sharing,
      view_count: 0,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + shareSettings.default_expiry_days * 24 * 60 * 60 * 1000).toISOString(),
      created_by: 'current-user'
    };

    setSharedConversations([newShare, ...sharedConversations]);
    setSelectedConversation('');
    setShareDialogOpen(false);

    toast({
      title: 'Conversation Shared',
      description: 'Share link has been created successfully.'
    });
  };

  const togglePublicStatus = (shareId: string) => {
    setSharedConversations(sharedConversations.map(share =>
      share.id === shareId
        ? { ...share, is_public: !share.is_public }
        : share
    ));

    toast({
      title: 'Share Updated',
      description: 'Share visibility has been updated.'
    });
  };

  const deleteShare = (shareId: string) => {
    setSharedConversations(sharedConversations.filter(share => share.id !== shareId));

    toast({
      title: 'Share Deleted',
      description: 'Shared conversation link has been removed.'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading conversation sharing system...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Share className="w-5 h-5" />
            Conversation Sharing System
          </h3>
          <p className="text-muted-foreground">Manage and monitor shared conversations</p>
        </div>

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Share className="w-4 h-4 mr-2" />
              Create Share Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="conversation-select">Select Conversation</Label>
                <select
                  id="conversation-select"
                  value={selectedConversation}
                  onChange={(e) => setSelectedConversation(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">Select a conversation...</option>
                  <option value="conv-1">Daily Prayer Guidance</option>
                  <option value="conv-2">Islamic Finance Discussion</option>
                  <option value="conv-3">Quran Study Session</option>
                  <option value="conv-4">Ramadan Preparation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expires in Days</Label>
                  <Input
                    type="number"
                    value={shareSettings.default_expiry_days}
                    onChange={(e) => setShareSettings({
                      ...shareSettings,
                      default_expiry_days: parseInt(e.target.value) || 30
                    })}
                  />
                </div>
                <div>
                  <Label>Max Views</Label>
                  <Input
                    type="number"
                    value={shareSettings.max_views}
                    onChange={(e) => setShareSettings({
                      ...shareSettings,
                      max_views: parseInt(e.target.value) || 1000
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public-sharing"
                  checked={shareSettings.allow_public_sharing}
                  onChange={(e) => setShareSettings({
                    ...shareSettings,
                    allow_public_sharing: e.target.checked
                  })}
                />
                <Label htmlFor="public-sharing">Make publicly accessible</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={createNewShare} className="flex-1">
                  Create Share Link
                </Button>
                <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Share className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Shares</p>
              <p className="text-2xl font-bold">{sharedConversations.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">
                {sharedConversations.reduce((acc, share) => acc + share.view_count, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Public Shares</p>
              <p className="text-2xl font-bold">
                {sharedConversations.filter(share => share.is_public).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Private Shares</p>
              <p className="text-2xl font-bold">
                {sharedConversations.filter(share => !share.is_public).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Shared Conversations List */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Shared Conversations</h4>
        <div className="space-y-4">
          {sharedConversations.map((share) => (
            <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-2 ${share.is_public ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium">{share.title}</h5>
                    <Badge variant={share.is_public ? "default" : "secondary"}>
                      {share.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {share.view_count} views
                    </span>
                    <span>Created: {new Date(share.created_at).toLocaleDateString()}</span>
                    {share.expires_at && (
                      <span>Expires: {new Date(share.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Share Token: {share.share_token}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyShareLink(share.share_token, share.is_public)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(generateShareLink(share.share_token, share.is_public), '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={share.is_public ? "secondary" : "default"}
                  onClick={() => togglePublicStatus(share.id)}
                >
                  {share.is_public ? 'Make Private' : 'Make Public'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteShare(share.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          
          {sharedConversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Share className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No shared conversations</h3>
              <p>Create your first shared conversation link to get started.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};