import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event_name: string;
  properties?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeUser();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id;
  }

  async track(eventName: string, properties: Record<string, any> = {}) {
    try {
      const event: AnalyticsEvent = {
        event_name: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          page_url: window.location.href,
          page_title: document.title,
          user_agent: navigator.userAgent,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
        },
        user_id: this.userId,
        session_id: this.sessionId
      };

      // Store locally until database table is available
      const analyticsData = localStorage.getItem('analytics_events') || '[]';
      const events = JSON.parse(analyticsData);
      events.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100))); // Keep last 100 events

      console.log('Analytics event tracked:', eventName, properties);
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  // Track page views
  pageView(pageName: string) {
    this.track('page_view', {
      page_name: pageName,
      referrer: document.referrer
    });
  }

  // Track user actions
  userAction(action: string, context: Record<string, any> = {}) {
    this.track('user_action', {
      action,
      ...context
    });
  }

  // Track errors
  error(errorMessage: string, errorStack?: string, context: Record<string, any> = {}) {
    this.track('error', {
      error_message: errorMessage,
      error_stack: errorStack,
      ...context
    });
  }

  // Track performance metrics
  performance(metric: string, value: number, context: Record<string, any> = {}) {
    this.track('performance', {
      metric,
      value,
      ...context
    });
  }

  // Track AI interactions
  aiInteraction(type: 'question' | 'response', content: string, metadata: Record<string, any> = {}) {
    this.track('ai_interaction', {
      interaction_type: type,
      content_length: content.length,
      has_voice: metadata.hasVoice || false,
      response_time: metadata.responseTime,
      ...metadata
    });
  }
}

// Singleton instance
export const analytics = new Analytics();

// React hook for analytics
export const useAnalytics = () => {
  useEffect(() => {
    // Track page view on mount
    analytics.pageView(window.location.pathname);

    // Track performance metrics
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        analytics.performance('page_load_time', navigation.loadEventEnd - navigation.loadEventStart);
        analytics.performance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
      }
    }

    // Track errors globally
    const handleError = (event: ErrorEvent) => {
      analytics.error(event.message, event.error?.stack, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.error('Unhandled Promise Rejection', String(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return analytics;
};