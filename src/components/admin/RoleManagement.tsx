import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { AppRole } from '@/hooks/useRole';

interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  user_display_name?: string;
  tenant_name?: string;
}

export const RoleManagement = () => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    user_id: '',
    tenant_id: '',
    role: 'user' as AppRole
  });

  useEffect(() => {
    Promise.all([
      fetchUserRoles(),
      fetchTenants(),
      fetchUsers()
    ]);
  }, []);

  const fetchUserRoles = async () => {
    try {
      // For now, return mock data until types are updated
      setUserRoles([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch user roles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      // Mock data for now
      setTenants([{ id: '1', name: 'Default Organization', slug: 'default' }]);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: 'Info',
      description: 'Role assignment will be available after database types are updated'
    });
    
    setFormData({ user_id: '', tenant_id: '', role: 'user' });
    setIsAssignDialogOpen(false);
  };

  const handleRevokeRole = async (roleId: string) => {
    toast({
      title: 'Info',
      description: 'Role revocation will be available after database types are updated'
    });
  };

  const getRoleColor = (role: AppRole) => {
    switch (role) {
      case 'master_admin': return 'destructive';
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Role Management
          </h2>
          <p className="text-muted-foreground">Assign and manage user roles across tenants</p>
        </div>
        
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign User Role</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <Label htmlFor="user">User</Label>
                <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        {user.display_name || 'Unnamed User'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tenant">Tenant</Label>
                <Select value={formData.tenant_id} onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as AppRole })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Assign Role
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(['master_admin', 'admin', 'moderator', 'user'] as AppRole[]).map((role) => (
          <Card key={role} className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {role.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-2xl font-bold">
                  {userRoles.filter(ur => ur.role === role && ur.is_active).length}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* User Roles List */}
      <div className="grid gap-4">
        {userRoles.map((userRole) => (
          <Card key={userRole.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">{userRole.user_display_name}</h3>
                  <p className="text-sm text-muted-foreground">Tenant: {userRole.tenant_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Assigned: {new Date(userRole.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getRoleColor(userRole.role)}>
                  {userRole.role.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant={userRole.is_active ? 'default' : 'secondary'}>
                  {userRole.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRevokeRole(userRole.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {userRoles.length === 0 && (
          <Card className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No roles assigned</h3>
            <p className="text-muted-foreground">Start by assigning roles to users.</p>
          </Card>
        )}
      </div>
    </div>
  );
};