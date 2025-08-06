import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users,
  Star,
  FileText,
  Search
} from 'lucide-react';

interface ContentItem {
  id: string;
  content: string;
  type: 'verse' | 'hadith' | 'response';
  source?: string;
  verification_status: 'pending' | 'verified' | 'flagged' | 'rejected';
  confidence_score: number;
  scholar_reviewed: boolean;
  citations: string[];
  created_at: string;
}

interface VerificationMetrics {
  total_content: number;
  verified_content: number;
  pending_review: number;
  flagged_content: number;
  average_confidence: number;
  scholar_reviewed_percentage: number;
}

export const ContentVerificationPipeline = () => {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [metrics, setMetrics] = useState<VerificationMetrics>({
    total_content: 0,
    verified_content: 0,
    pending_review: 0,
    flagged_content: 0,
    average_confidence: 0,
    scholar_reviewed_percentage: 0
  });
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    const mockContent: ContentItem[] = [
      {
        id: '1',
        content: 'Patience (Sabr) is one of the most emphasized virtues in Islam...',
        type: 'response',
        verification_status: 'verified',
        confidence_score: 95,
        scholar_reviewed: true,
        citations: ['Quran 2:155', 'Sahih Bukhari 6469'],
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        content: 'And whoever relies upon Allah - then He is sufficient for him.',
        type: 'verse',
        source: 'Quran 65:3',
        verification_status: 'verified',
        confidence_score: 100,
        scholar_reviewed: true,
        citations: ['Quran 65:3'],
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '3',
        content: 'Prayer is better than sleep (Assalatu khayrun min an-naum)',
        type: 'hadith',
        source: 'Adhan tradition',
        verification_status: 'pending',
        confidence_score: 85,
        scholar_reviewed: false,
        citations: ['Various hadith collections'],
        created_at: '2024-01-15T11:00:00Z'
      },
      {
        id: '4',
        content: 'Some questionable interpretation without proper citation...',
        type: 'response',
        verification_status: 'flagged',
        confidence_score: 45,
        scholar_reviewed: false,
        citations: [],
        created_at: '2024-01-15T12:00:00Z'
      }
    ];

    setContentItems(mockContent);
    
    const calculatedMetrics: VerificationMetrics = {
      total_content: mockContent.length,
      verified_content: mockContent.filter(item => item.verification_status === 'verified').length,
      pending_review: mockContent.filter(item => item.verification_status === 'pending').length,
      flagged_content: mockContent.filter(item => item.verification_status === 'flagged').length,
      average_confidence: mockContent.reduce((sum, item) => sum + item.confidence_score, 0) / mockContent.length,
      scholar_reviewed_percentage: (mockContent.filter(item => item.scholar_reviewed).length / mockContent.length) * 100
    };

    setMetrics(calculatedMetrics);
    setLoading(false);
  }, []);

  const getStatusBadge = (status: ContentItem['verification_status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'flagged':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><AlertTriangle className="w-3 h-3 mr-1" />Flagged</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: ContentItem['type']) => {
    switch (type) {
      case 'verse':
        return <BookOpen className="w-4 h-4 text-primary" />;
      case 'hadith':
        return <Star className="w-4 h-4 text-accent" />;
      case 'response':
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_content}</div>
            <p className="text-xs text-muted-foreground">Items in database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.verified_content}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.verified_content / metrics.total_content) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg. Confidence</CardTitle>
              <Shield className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.average_confidence.toFixed(1)}%</div>
            <Progress value={metrics.average_confidence} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Scholar Reviewed</CardTitle>
              <Users className="w-4 h-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.scholar_reviewed_percentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">By Islamic scholars</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for pending items */}
      {metrics.pending_review > 0 && (
        <Alert className="border-yellow-500/20 bg-yellow-500/5">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription>
            There are {metrics.pending_review} items waiting for scholar review and {metrics.flagged_content} items flagged for attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Content Pipeline Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Content Verification Pipeline
          </CardTitle>
          <CardDescription>
            Real-time monitoring of Islamic content authenticity and scholar verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {contentItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <span className="text-sm font-medium capitalize">{item.type}</span>
                    {item.source && (
                      <Badge variant="outline" className="text-xs">
                        {item.source}
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(item.verification_status)}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.content}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span>Confidence: {item.confidence_score}%</span>
                    <span className={item.scholar_reviewed ? 'text-green-600' : 'text-yellow-600'}>
                      {item.scholar_reviewed ? '✓ Scholar Reviewed' : '⏳ Awaiting Review'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.citations.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {item.citations.length} Citation{item.citations.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <Search className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {item.verification_status === 'flagged' && (
                  <Alert className="border-red-500/20 bg-red-500/5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-xs">
                      This content has been flagged for manual review due to low confidence score or missing citations.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Process Info */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Process</CardTitle>
          <CardDescription>
            How we ensure authentic Islamic content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium">Automated Screening</h4>
              <p className="text-sm text-muted-foreground">
                AI-powered citation checking and source verification
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h4 className="font-medium">Scholar Review</h4>
              <p className="text-sm text-muted-foreground">
                Verification by qualified Islamic scholars
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium">Final Approval</h4>
              <p className="text-sm text-muted-foreground">
                Content approved for public use
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};