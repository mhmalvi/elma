import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Users,
  Lock,
  FileText,
  Clock,
  Activity,
  Filter
} from 'lucide-react';

interface SafetyMetrics {
  total_interactions: number;
  flagged_content: number;
  auto_filtered: number;
  manual_reviews: number;
  compliance_score: number;
  response_time: number;
}

interface FilterRule {
  id: string;
  name: string;
  type: 'hate_speech' | 'misinformation' | 'inappropriate' | 'off_topic';
  status: 'active' | 'inactive';
  confidence_threshold: number;
  actions: string[];
}

interface ComplianceLog {
  id: string;
  timestamp: string;
  event_type: 'content_filtered' | 'manual_review' | 'policy_violation' | 'system_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action_taken: string;
  user_id?: string;
}

export const SafetyComplianceSystem = () => {
  const [metrics, setMetrics] = useState<SafetyMetrics>({
    total_interactions: 0,
    flagged_content: 0,
    auto_filtered: 0,
    manual_reviews: 0,
    compliance_score: 0,
    response_time: 0
  });
  
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data initialization
  useEffect(() => {
    const mockMetrics: SafetyMetrics = {
      total_interactions: 15847,
      flagged_content: 23,
      auto_filtered: 12,
      manual_reviews: 11,
      compliance_score: 98.5,
      response_time: 150 // milliseconds
    };

    const mockFilterRules: FilterRule[] = [
      {
        id: '1',
        name: 'Hate Speech Detection',
        type: 'hate_speech',
        status: 'active',
        confidence_threshold: 85,
        actions: ['block', 'flag_for_review', 'log_incident']
      },
      {
        id: '2',
        name: 'Islamic Misinformation Filter',
        type: 'misinformation',
        status: 'active',
        confidence_threshold: 80,
        actions: ['require_citation', 'scholar_review', 'quarantine']
      },
      {
        id: '3',
        name: 'Inappropriate Content Filter',
        type: 'inappropriate',
        status: 'active',
        confidence_threshold: 75,
        actions: ['content_warning', 'age_restrict', 'community_review']
      },
      {
        id: '4',
        name: 'Off-Topic Content Detection',
        type: 'off_topic',
        status: 'active',
        confidence_threshold: 70,
        actions: ['redirect_to_islamic_topics', 'gentle_reminder']
      }
    ];

    const mockLogs: ComplianceLog[] = [
      {
        id: '1',
        timestamp: '2024-01-15T14:30:00Z',
        event_type: 'content_filtered',
        severity: 'medium',
        description: 'Potential hate speech detected and automatically filtered',
        action_taken: 'Content blocked, user notified with guidance',
        user_id: 'user_123'
      },
      {
        id: '2',
        timestamp: '2024-01-15T13:45:00Z',
        event_type: 'manual_review',
        severity: 'low',
        description: 'Hadith authenticity questioned, sent for scholar verification',
        action_taken: 'Forwarded to Islamic scholar panel',
        user_id: 'user_456'
      },
      {
        id: '3',
        timestamp: '2024-01-15T12:20:00Z',
        event_type: 'system_alert',
        severity: 'high',
        description: 'Unusual pattern of off-topic questions detected',
        action_taken: 'Enhanced monitoring activated',
        user_id: 'user_789'
      }
    ];

    setMetrics(mockMetrics);
    setFilterRules(mockFilterRules);
    setComplianceLogs(mockLogs);
    setLoading(false);
  }, []);

  const getSeverityBadge = (severity: ComplianceLog['severity']) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Low</Badge>;
    }
  };

  const getEventIcon = (eventType: ComplianceLog['event_type']) => {
    switch (eventType) {
      case 'content_filtered':
        return <Filter className="w-4 h-4 text-blue-600" />;
      case 'manual_review':
        return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'policy_violation':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'system_alert':
        return <Activity className="w-4 h-4 text-purple-600" />;
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
      {/* Safety Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <Shield className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.compliance_score}%</div>
            <Progress value={metrics.compliance_score} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Auto-Filtered</CardTitle>
              <Filter className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.auto_filtered}</div>
            <p className="text-xs text-muted-foreground">
              {((metrics.auto_filtered / metrics.total_interactions) * 100).toFixed(2)}% of interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Manual Reviews</CardTitle>
              <Eye className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.manual_reviews}</div>
            <p className="text-xs text-muted-foreground">Requiring human oversight</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.response_time}ms</div>
            <p className="text-xs text-muted-foreground">Average filter response</p>
          </CardContent>
        </Card>
      </div>

      {/* System Status Alert */}
      {metrics.compliance_score < 95 && (
        <Alert className="border-yellow-500/20 bg-yellow-500/5">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription>
            Compliance score is below optimal threshold. Recommend reviewing filter rules and increasing manual oversight.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Filter Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Active Safety Filters
          </CardTitle>
          <CardDescription>
            Real-time content filtering and safety measures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filterRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge 
                      variant={rule.status === 'active' ? 'default' : 'secondary'}
                      className={rule.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
                    >
                      {rule.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Threshold: {rule.confidence_threshold}%
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground mb-3">
                  Type: <span className="capitalize font-medium">{rule.type.replace('_', ' ')}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {rule.actions.map((action, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {action.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Compliance Activity
          </CardTitle>
          <CardDescription>
            Audit trail of safety and compliance events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getEventIcon(log.event_type)}
                    <span className="font-medium text-sm capitalize">
                      {log.event_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(log.severity)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {log.description}
                </p>
                
                <div className="text-xs">
                  <span className="font-medium">Action taken:</span> {log.action_taken}
                  {log.user_id && (
                    <span className="ml-2 text-muted-foreground">
                      (User: {log.user_id})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Safety & Compliance Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Content Standards</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• All Islamic content must be verified by qualified scholars</li>
                <li>• Sources must be cited for Quranic verses and Hadith</li>
                <li>• Respect for different schools of Islamic thought</li>
                <li>• No content promoting extremism or hatred</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">User Protection</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Real-time filtering of inappropriate content</li>
                <li>• Automated blocking of hate speech</li>
                <li>• Human oversight for complex theological questions</li>
                <li>• Privacy protection and data security</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};