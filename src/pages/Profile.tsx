import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Settings, Save, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  display_name: string;
  avatar_url: string;
  role: string;
  preferences: any;
}

const Profile = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({
    display_name: '',
    avatar_url: '',
    role: 'user',
    preferences: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          avatar_url: data.avatar_url || '',
          role: data.role || 'user',
          preferences: data.preferences || {}
        });
      } else {
        // Create profile if it doesn't exist
        setProfile({
          display_name: user?.email?.split('@')[0] || '',
          avatar_url: user?.user_metadata?.avatar_url || '',
          role: 'user',
          preferences: {}
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          preferences: profile.preferences
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      setProfile(prev => ({ ...prev, avatar_url: data.publicUrl }));

      toast({
        title: "Success",
        description: "Avatar uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }

      uploadAvatar(file);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url} alt="Profile" />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl font-bold">
                  {profile.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-xl">{profile.display_name || user.email}</CardTitle>
                <div className="flex items-center gap-2">
                  <CardDescription>{user.email}</CardDescription>
                  <Badge variant={profile.role === 'master_admin' ? 'default' : 'secondary'} className="text-xs">
                    {profile.role === 'master_admin' ? 'Master Admin' : 'User'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Enter your display name"
                className="border-2 border-border/50 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/15 transition-all duration-200"
              />
              <p className="text-xs text-muted-foreground">
                This is how your name will appear in conversations
              </p>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatarUrl" className="text-sm font-medium">
                Avatar URL
              </Label>
              <div className="flex gap-3">
                <Input
                  id="avatarUrl"
                  value={profile.avatar_url}
                  onChange={(e) => setProfile(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 border-2 border-border/50 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/15 transition-all duration-200"
                />
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-10 w-10 relative hover:bg-teal-50 hover:border-teal-400 transition-colors"
                    asChild
                  >
                    <div>
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="avatar-upload"
                        style={{ fontSize: '0' }}
                      />
                    </div>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Add a profile picture URL or click upload to select an image (max 5MB)
              </p>
            </div>

            {/* Account Information */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <h3 className="text-sm font-medium text-foreground">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Member Since</Label>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button 
                onClick={saveProfile} 
                disabled={isSaving}
                className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90 text-white border-2 border-teal-400"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button variant="outline" onClick={loadProfile} className="px-6">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center space-y-2">
              <Settings className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="font-medium">App Settings</h3>
              <p className="text-sm text-muted-foreground">Voice, notifications, and preferences</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center space-y-2">
              <User className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
              <h3 className="font-medium">Privacy</h3>
              <p className="text-sm text-muted-foreground">Data and security settings</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;