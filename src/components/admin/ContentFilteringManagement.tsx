import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentFilter {
  id: string;
  keyword: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
}

export const ContentFilteringManagement = () => {
  const [filters, setFilters] = useState<ContentFilter[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Pre-defined inappropriate content filters for Islamic context
  const defaultFilters = [
    { keyword: 'inappropriate language', severity: 'high' as const },
    { keyword: 'offensive content', severity: 'critical' as const },
    { keyword: 'blasphemy', severity: 'critical' as const },
    { keyword: 'hate speech', severity: 'critical' as const },
    { keyword: 'adult content', severity: 'high' as const },
    { keyword: 'violence', severity: 'medium' as const },
    { keyword: 'gambling', severity: 'medium' as const },
    { keyword: 'alcohol', severity: 'low' as const },
  ];

  useEffect(() => {
    // Initialize with default filters since we don't have the table yet
    const mockFilters: ContentFilter[] = defaultFilters.map((filter, index) => ({
      id: `filter-${index}`,
      keyword: filter.keyword,
      severity: filter.severity,
      is_active: true,
      created_at: new Date().toISOString()
    }));
    
    setFilters(mockFilters);
    setLoading(false);
  }, []);

  const handleAddFilter = () => {
    if (!newKeyword.trim()) return;

    const newFilter: ContentFilter = {
      id: `filter-${Date.now()}`,
      keyword: newKeyword.trim(),
      severity: newSeverity,
      is_active: true,
      created_at: new Date().toISOString()
    };

    setFilters([...filters, newFilter]);
    setNewKeyword('');
    
    toast({
      title: 'Filter Added',
      description: `Content filter for "${newKeyword}" has been added.`
    });
  };

  const toggleFilter = (filterId: string) => {
    setFilters(filters.map(filter => 
      filter.id === filterId 
        ? { ...filter, is_active: !filter.is_active }
        : filter
    ));
    
    toast({
      title: 'Filter Updated',
      description: 'Filter status has been updated.'
    });
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(filter => filter.id !== filterId));
    
    toast({
      title: 'Filter Removed',
      description: 'Content filter has been removed.'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading content filters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Content Filtering Management
        </h3>
        <p className="text-muted-foreground">Manage inappropriate content filters to maintain Islamic values</p>
      </div>

      {/* Add New Filter */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Add New Content Filter</h4>
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="keyword">Keyword/Phrase</Label>
            <Input
              id="keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Enter inappropriate keyword or phrase"
            />
          </div>
          <div>
            <Label htmlFor="severity">Severity Level</Label>
            <select
              id="severity"
              value={newSeverity}
              onChange={(e) => setNewSeverity(e.target.value as any)}
              className="w-32 px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddFilter}>Add Filter</Button>
          </div>
        </div>
      </Card>

      {/* Filter Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active Filters</p>
              <p className="text-2xl font-bold">{filters.filter(f => f.is_active).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Critical Filters</p>
              <p className="text-2xl font-bold">{filters.filter(f => f.severity === 'critical').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Filters</p>
              <p className="text-2xl font-bold">{filters.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold">{filters.filter(f => !f.is_active).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Filters List */}
      <Card className="p-4">
        <h4 className="font-semibold mb-4">Content Filters</h4>
        <div className="space-y-3">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${filter.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="font-medium">{filter.keyword}</span>
                <Badge variant={getSeverityColor(filter.severity)}>
                  {filter.severity.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filter.is_active ? "secondary" : "default"}
                  onClick={() => toggleFilter(filter.id)}
                >
                  {filter.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeFilter(filter.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          
          {filters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No content filters configured. Add filters to maintain content quality.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};