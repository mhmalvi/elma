import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Edit3, Star, Pin, Archive, Download, Trash2 } from 'lucide-react';

interface ConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: any;
  type: 'rename' | 'pin' | 'archive' | 'export';
  onConfirm: (data: any) => void;
}

export const ConversationDialog = ({ 
  open, 
  onOpenChange, 
  conversation, 
  type, 
  onConfirm 
}: ConversationDialogProps) => {
  const [title, setTitle] = useState(conversation?.title || '');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    switch (type) {
      case 'rename':
        onConfirm({ title: title.trim() });
        break;
      case 'pin':
        onConfirm({ pinned: true, description: description.trim() });
        break;
      case 'archive':
        onConfirm({ archived: true, description: description.trim() });
        break;
      case 'export':
        onConfirm({ format: 'json' });
        break;
    }
    onOpenChange(false);
  };

  const getDialogContent = () => {
    switch (type) {
      case 'rename':
        return {
          icon: <Edit3 className="w-5 h-5 text-primary" />,
          title: 'Rename Conversation',
          description: 'Enter a new title for this conversation',
          content: (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Conversation Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter conversation title..."
                  className="w-full"
                  autoFocus
                />
              </div>
            </div>
          ),
          confirmText: 'Rename',
          disabled: !title.trim() || title.trim() === conversation?.title
        };

      case 'pin':
        return {
          icon: <Pin className="w-5 h-5 text-amber-500" />,
          title: 'Pin to Top',
          description: 'Pin this conversation to the top of your list',
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This conversation will appear at the top of your sidebar for quick access.
              </p>
              <div className="space-y-2">
                <Label htmlFor="description">Add a note (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why is this conversation important?"
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>
          ),
          confirmText: 'Pin Conversation',
          disabled: false
        };

      case 'archive':
        return {
          icon: <Archive className="w-5 h-5 text-blue-500" />,
          title: 'Archive Conversation',
          description: 'Move this conversation to your archive',
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Archived conversations are hidden from your main list but can be restored later.
              </p>
              <div className="space-y-2">
                <Label htmlFor="description">Archive reason (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why are you archiving this conversation?"
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>
          ),
          confirmText: 'Archive',
          disabled: false
        };

      case 'export':
        return {
          icon: <Download className="w-5 h-5 text-green-500" />,
          title: 'Export Conversation',
          description: 'Download your conversation data',
          content: (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your conversation will be exported as a JSON file containing all messages and metadata.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  <span className="font-medium">{conversation?.title || 'Untitled'}.json</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: JSON • Size: ~{Math.floor(Math.random() * 50) + 10}KB
                </p>
              </div>
            </div>
          ),
          confirmText: 'Export',
          disabled: false
        };

      default:
        return null;
    }
  };

  const dialogContent = getDialogContent();
  if (!dialogContent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {dialogContent.icon}
            <DialogTitle>{dialogContent.title}</DialogTitle>
          </div>
          <DialogDescription>
            {dialogContent.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {dialogContent.content}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={dialogContent.disabled}
            className="min-w-24"
          >
            {dialogContent.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};