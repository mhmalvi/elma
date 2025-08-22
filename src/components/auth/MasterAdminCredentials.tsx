import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, EyeOff, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const MasterAdminCredentials = () => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const credentials = {
    email: 'admin@elma.com',
    password: 'MasterAdmin2024!'
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <Shield className="w-5 h-5" />
          Master Admin Credentials
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          Use these credentials to sign in as master admin with full system access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-mono text-sm">{credentials.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(credentials.email, 'Email')}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Password</p>
              <p className="font-mono text-sm">
                {showPassword ? credentials.password : '••••••••••••••'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(credentials.password, 'Password')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700">
            Master Admin
          </Badge>
          <span>Full system access including user management, content moderation, and system settings</span>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>⚠️ Keep these credentials secure. Master admin has complete control over the system.</p>
        </div>
      </CardContent>
    </Card>
  );
};