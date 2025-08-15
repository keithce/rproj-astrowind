/**
 * Link Analytics and Performance Tracking
 * Provides insights into internal linking effectiveness
 */

export interface LinkClickEvent {
  linkText: string;
  destination: string;
  source: string;
  timestamp: number;
  linkType: 'internal' | 'external' | 'service' | 'blog' | 'contextual';
}

export interface LinkPerformanceData {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  conversionRate?: number;
  avgTimeOnPage?: number;
}

class LinkAnalytics {
  private events: LinkClickEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private setupEventListeners(): void {
    // Track all internal link clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        this.trackLinkClick(link, event);
      }
    });

    // Track page load performance
    window.addEventListener('load', () => {
      this.trackPageLoad();
    });
  }

  private trackLinkClick(link: HTMLAnchorElement, event: MouseEvent): void {
    const href = link.href;
    const linkText = link.textContent?.trim() || '';
    const source = window.location.pathname;
    
    // Determine link type
    let linkType: LinkClickEvent['linkType'] = 'external';
    
    if (href.includes(window.location.hostname) || href.startsWith('/')) {
      linkType = 'internal';
      
      // Categorize internal links
      if (href.includes('/services/')) {
        linkType = 'service';
      } else if (href.includes('/blog/')) {
        linkType = 'blog';
      } else if (link.hasAttribute('data-contextual-link')) {
        linkType = 'contextual';
      }
    }

    const clickEvent: LinkClickEvent = {
      linkText,
      destination: href,
      source,
      timestamp: Date.now(),
      linkType
    };

    this.events.push(clickEvent);
    this.sendAnalytics(clickEvent);
  }

  private trackPageLoad(): void {
    const performanceData = {
      url: window.location.pathname,
      loadTime: performance.now(),
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    // Send performance data
    this.sendPerformanceData(performanceData);
  }

  private sendAnalytics(event: LinkClickEvent): void {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'internal_link_click', {
        link_text: event.linkText,
        link_destination: event.destination,
        link_type: event.linkType,
        source_page: event.source,
        session_id: this.sessionId,
        custom_event_category: 'navigation'
      });
    }

    // Custom analytics endpoint (optional)
    if (window.location.hostname !== 'localhost') {
      fetch('/api/analytics/link-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        keepalive: true
      }).catch(() => {
        // Fail silently to not impact user experience
      });
    }

    // Development logging
    if (import.meta.env.DEV) {
      console.log('Link click tracked:', event);
    }
  }

  private sendPerformanceData(data: any): void {
    // Track page performance
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_load_complete', {
        page_location: data.url,
        load_time: Math.round(data.loadTime),
        session_id: this.sessionId
      });
    }
  }

  /**
   * Get link performance summary
   */
  public getPerformanceSummary(): {
    totalClicks: number;
    serviceClicks: number;
    blogClicks: number;
    conversionRate: number;
    topDestinations: Array<{ url: string; clicks: number }>;
  } {
    const totalClicks = this.events.length;
    const serviceClicks = this.events.filter(e => e.linkType === 'service').length;
    const blogClicks = this.events.filter(e => e.linkType === 'blog').length;
    
    // Calculate top destinations
    const destinationCounts = this.events.reduce((acc, event) => {
      acc[event.destination] = (acc[event.destination] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topDestinations = Object.entries(destinationCounts)
      .map(([url, clicks]) => ({ url, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    return {
      totalClicks,
      serviceClicks,
      blogClicks,
      conversionRate: 0, // Would need conversion tracking
      topDestinations
    };
  }

  /**
   * Generate linking recommendations
   */
  public generateRecommendations(): Array<{
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const summary = this.getPerformanceSummary();
    const recommendations = [];

    // Low service engagement
    if (summary.serviceClicks / summary.totalClicks < 0.3) {
      recommendations.push({
        type: 'service_promotion',
        message: 'Consider adding more prominent service links to increase service page engagement',
        priority: 'high' as const
      });
    }

    // High blog engagement
    if (summary.blogClicks / summary.totalClicks > 0.5) {
      recommendations.push({
        type: 'blog_optimization',
        message: 'Blog content is popular - add more service CTAs to blog posts',
        priority: 'medium' as const
      });
    }

    return recommendations;
  }
}

// Initialize analytics
let analytics: LinkAnalytics;

export function initializeLinkAnalytics(): void {
  if (typeof window !== 'undefined' && !analytics) {
    analytics = new LinkAnalytics();
  }
}

export function getLinkAnalytics(): LinkAnalytics | undefined {
  return analytics;
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeLinkAnalytics);
}