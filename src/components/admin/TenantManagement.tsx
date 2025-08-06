import { useState, useEffect } from 'react';
import { Plus, Edit, Building, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DeleteButton } from '@/components/ui/delete-button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: any;
  is_active: boolean;
  created_at: string;
}

export const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    settings: '{"features": ["voice", "chat", "islamic_content"]}'
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      // Mock data for now until types are updated
      setTenants([
        {
          id: '1',
          name: 'Default Organization',
          slug: 'default',
          settings: { features: ['voice', 'chat', 'islamic_content'] },
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch tenants',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: 'Info',
      description: 'Tenant management will be fully functional after database types are updated'
    });

    setFormData({ name: '', slug: '', settings: '{"features": ["voice", "chat", "islamic_content"]}' });
    setEditingTenant(null);
    setIsCreateDialogOpen(false);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      slug: tenant.slug,
      settings: JSON.stringify(tenant.settings, null, 2)
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (tenantId: string) => {
    toast({
      title: 'Info',
      description: 'Tenant deletion will be available after database types are updated'
    });
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingTenant(null);
    setFormData({ name: '', slug: '', settings: '{"features": ["voice", "chat", "islamic_content"]}' });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading tenants...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building className="w-6 h-6" />
            Tenant Management
          </h2>
          <p className="text-muted-foreground">Manage organizations and their settings</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tenant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Organization Name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="organization-slug"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="settings">Settings (JSON)</Label>
                <Textarea
                  id="settings"
                  value={formData.settings}
                  onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
                  placeholder='{"features": ["voice", "chat", "islamic_content"]}'
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTenant ? 'Update' : 'Create'} Tenant
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{tenant.name}</h3>
                  <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                    {tenant.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Slug: {tenant.slug}</p>
                <div className="flex gap-2 flex-wrap">
                  {tenant.settings?.features?.map((feature: string) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(tenant.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(tenant)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <DeleteButton
                  variant="destructive"
                  size="sm"
                  onDelete={() => handleDelete(tenant.id)}
                  tooltip="Delete tenant"
                />
              </div>
            </div>
          </Card>
        ))}
        
        {tenants.length === 0 && (
          <Card className="p-8 text-center">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tenants found</h3>
            <p className="text-muted-foreground">Create your first tenant to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
};