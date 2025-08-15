/**
 * Internal Linking Strategy Utilities
 * Provides intelligent link suggestions and relationship mapping
 */

export interface PageRelationship {
  type: 'service' | 'blog' | 'til' | 'about' | 'landing';
  title: string;
  href: string;
  description: string;
  icon?: string;
  category?: string;
  tags?: string[];
  priority: number; // 1-10, higher = more important
}

export interface LinkSuggestion {
  anchor: string;
  href: string;
  context: string;
  priority: number;
  type: 'contextual' | 'navigational' | 'promotional';
}

// Define site structure and relationships
export const SITE_STRUCTURE: Record<string, PageRelationship> = {
  '/': {
    type: 'landing',
    title: 'Home',
    href: '/',
    description: 'Creative technology studio for tech consulting, mixing & mastering, photography, and film finishing',
    icon: 'tabler:home',
    priority: 10,
    tags: ['home', 'landing', 'services', 'portfolio']
  },
  '/about': {
    type: 'about',
    title: 'My Story',
    href: '/about',
    description: 'Personal journey from classical music to audio engineering and creative technology',
    icon: 'tabler:user',
    priority: 8,
    tags: ['biography', 'experience', 'background', 'story']
  },
  '/services': {
    type: 'service',
    title: 'All Services',
    href: '/services',
    description: 'Overview of all creative technology services offered',
    icon: 'tabler:briefcase',
    priority: 9,
    tags: ['services', 'overview', 'portfolio']
  },
  '/services/design': {
    type: 'service',
    title: 'Resonant Design',
    href: '/services/design',
    description: 'Bespoke consulting for creator solopreneurs and small businesses',
    icon: 'tabler:vector-bezier-2',
    category: 'Consulting',
    priority: 9,
    tags: ['consulting', 'workflow', 'technology', 'business', 'optimization']
  },
  '/services/rhythm': {
    type: 'service',
    title: 'Resonant Rhythm',
    href: '/services/rhythm',
    description: 'Music finishing, mixing, and mastering for artists',
    icon: 'tabler:music',
    category: 'Audio',
    priority: 9,
    tags: ['music', 'audio', 'mixing', 'mastering', 'production']
  },
  '/services/color': {
    type: 'service',
    title: 'Resonant Color',
    href: '/services/color',
    description: 'Photography portfolio and visual color work',
    icon: 'tabler:camera',
    category: 'Visual',
    priority: 9,
    tags: ['photography', 'color', 'visual', 'portfolio', 'grading']
  },
  '/services/motion': {
    type: 'service',
    title: 'Resonant Motion',
    href: '/services/motion',
    description: 'Post-production film finishing with sound and color expertise',
    icon: 'tabler:movie',
    category: 'Video',
    priority: 9,
    tags: ['video', 'film', 'post-production', 'sound', 'color']
  },
  '/contact': {
    type: 'landing',
    title: 'Contact Us',
    href: '/contact',
    description: 'Get in touch to start your creative project',
    icon: 'tabler:message-circle',
    priority: 8,
    tags: ['contact', 'form', 'inquiry', 'project']
  },
  '/blog': {
    type: 'blog',
    title: 'Blog',
    href: '/blog',
    description: 'Articles on creative technology, music production, and industry insights',
    icon: 'tabler:article',
    priority: 7,
    tags: ['blog', 'articles', 'insights', 'technology']
  },
  '/til': {
    type: 'til',
    title: 'Today I Learned',
    href: '/til',
    description: 'Daily discoveries and quick lessons in web development and technology',
    icon: 'tabler:bulb',
    priority: 6,
    tags: ['learning', 'development', 'technology', 'discoveries']
  },
  '/pricing': {
    type: 'landing',
    title: 'Pricing',
    href: '/pricing',
    description: 'Transparent pricing for all creative technology services',
    icon: 'tabler:currency-dollar',
    priority: 7,
    tags: ['pricing', 'cost', 'investment', 'packages']
  }
};

/**
 * Get related pages based on current page context
 */
export function getRelatedPages(
  currentPath: string, 
  maxResults: number = 4,
  includeServices: boolean = true
): PageRelationship[] {
  const currentPage = SITE_STRUCTURE[currentPath];
  const allPages = Object.values(SITE_STRUCTURE).filter(page => page.href !== currentPath);
  
  if (!currentPage) {
    // If page not found, return top priority pages
    return allPages
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxResults);
  }

  // Score pages based on relationship strength
  const scoredPages = allPages.map(page => {
    let score = 0;
    
    // Type matching
    if (page.type === currentPage.type) {
      score += 3;
    }
    
    // Category matching (for services)
    if (currentPage.category && page.category === currentPage.category) {
      score += 4;
    }
    
    // Tag overlap
    const currentTags = currentPage.tags || [];
    const pageTags = page.tags || [];
    const tagOverlap = currentTags.filter(tag => pageTags.includes(tag)).length;
    score += tagOverlap * 2;
    
    // Base priority
    score += page.priority / 10;
    
    // Service page preference
    if (includeServices && page.type === 'service') {
      score += 2;
    }
    
    return { ...page, score };
  });

  return scoredPages
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Generate contextual link suggestions for content
 */
export function generateLinkSuggestions(
  content: string, 
  currentPath: string
): LinkSuggestion[] {
  const suggestions: LinkSuggestion[] = [];
  const pages = Object.values(SITE_STRUCTURE);
  
  // Keywords that suggest linking opportunities
  const linkKeywords = {
    'consulting': '/services/design',
    'workflow optimization': '/services/design',
    'tech stack': '/services/design',
    'business consulting': '/services/design',
    
    'music': '/services/rhythm',
    'audio': '/services/rhythm',
    'mixing': '/services/rhythm',
    'mastering': '/services/rhythm',
    'music production': '/services/rhythm',
    'sound design': '/services/rhythm',
    
    'photography': '/services/color',
    'color grading': '/services/color',
    'visual': '/services/color',
    'portrait': '/services/color',
    'landscape': '/services/color',
    
    'video': '/services/motion',
    'film': '/services/motion',
    'post-production': '/services/motion',
    'motion graphics': '/services/motion',
    'editing': '/services/motion',
    
    'contact': '/contact',
    'get in touch': '/contact',
    'start project': '/contact',
    
    'blog': '/blog',
    'articles': '/blog',
    'insights': '/blog',
    
    'learn': '/til',
    'today i learned': '/til',
    'discovery': '/til',
    
    'pricing': '/pricing',
    'cost': '/pricing',
    'investment': '/pricing'
  };
  
  Object.entries(linkKeywords).forEach(([keyword, href]) => {
    if (href !== currentPath && content.toLowerCase().includes(keyword.toLowerCase())) {
      const page = pages.find(p => p.href === href);
      if (page) {
        suggestions.push({
          anchor: keyword,
          href,
          context: `Link to ${page.title}`,
          priority: page.priority,
          type: 'contextual'
        });
      }
    }
  });
  
  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * Generate anchor text variations for a link
 */
export function generateAnchorVariations(targetPage: string, context?: string): string[] {
  const page = SITE_STRUCTURE[targetPage];
  if (!page) return [];
  
  const variations: string[] = [page.title];
  
  // Add contextual variations based on page type
  switch (page.type) {
    case 'service':
      variations.push(
        `our ${page.title.toLowerCase()} services`,
        `learn more about ${page.title.toLowerCase()}`,
        `explore ${page.category?.toLowerCase()} solutions`,
        `${page.category} expertise`
      );
      break;
      
    case 'blog':
      variations.push(
        'our blog',
        'latest articles',
        'read more insights',
        'explore our content'
      );
      break;
      
    case 'about':
      variations.push(
        'our story',
        'about the team',
        'learn about our background',
        'discover our journey'
      );
      break;
      
    case 'landing':
      if (targetPage === '/contact') {
        variations.push(
          'get in touch',
          'contact us',
          'start your project',
          'book a consultation',
          'reach out today'
        );
      }
      break;
  }
  
  // Add context-specific variations
  if (context) {
    const contextLower = context.toLowerCase();
    if (contextLower.includes('call') || contextLower.includes('cta')) {
      variations.push(
        `start your ${page.category?.toLowerCase() || 'project'} today`,
        'get started now',
        'begin your journey'
      );
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Get breadcrumb path for a given route
 */
export function getBreadcrumbPath(pathname: string): Array<{text: string; href?: string; icon?: string}> {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: Array<{text: string; href?: string; icon?: string}> = [];
  
  // Handle specific routes
  if (pathname === '/') {
    return [{ text: 'Home', icon: 'tabler:home' }];
  }
  
  if (pathname.startsWith('/services/')) {
    breadcrumbs.push(
      { text: 'Services', href: '/services', icon: 'tabler:briefcase' }
    );
    
    const serviceName = segments[1];
    const servicePages = {
      'design': 'Resonant Design',
      'rhythm': 'Resonant Rhythm', 
      'color': 'Resonant Color',
      'motion': 'Resonant Motion'
    };
    
    if (serviceName in servicePages) {
      breadcrumbs.push({ text: servicePages[serviceName as keyof typeof servicePages] });
    }
  } else if (pathname.startsWith('/blog')) {
    breadcrumbs.push({ text: 'Blog', href: '/blog', icon: 'tabler:article' });
    
    if (segments.length > 1) {
      // Handle category or tag pages
      if (segments[1] === 'category') {
        breadcrumbs.push(
          { text: 'Categories', href: '/category' },
          { text: segments[2]?.replace('-', ' ') || 'Category' }
        );
      } else if (segments[1] === 'tag') {
        breadcrumbs.push(
          { text: 'Tags', href: '/tag' },
          { text: `#${segments[2]?.replace('-', ' ') || 'tag'}` }
        );
      } else {
        // Individual post
        breadcrumbs.push({ text: 'Post' });
      }
    }
  } else if (pathname.startsWith('/til')) {
    breadcrumbs.push({ text: 'Today I Learned', href: '/til', icon: 'tabler:bulb' });
    
    if (segments.length > 1) {
      if (segments[1] === 'board') {
        breadcrumbs.push({ text: 'Board View' });
      } else {
        breadcrumbs.push({ text: 'Entry' });
      }
    }
  } else {
    // Handle other pages
    const page = SITE_STRUCTURE[pathname];
    if (page) {
      breadcrumbs.push({ text: page.title, icon: page.icon });
    } else {
      // Generic breadcrumb for unknown pages
      segments.forEach((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        
        breadcrumbs.push({
          text: segment.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          href: isLast ? undefined : path
        });
      });
    }
  }
  
  return breadcrumbs;
}

/**
 * Generate SEO-optimized internal links for content
 */
export function optimizeInternalLinks(content: string, currentPath: string): string {
  let optimizedContent = content;
  const suggestions = generateLinkSuggestions(content, currentPath);
  
  // Apply contextual links (limit to avoid over-optimization)
  suggestions.slice(0, 3).forEach(suggestion => {
    const page = SITE_STRUCTURE[suggestion.href];
    if (page) {
      const linkPattern = new RegExp(`\\b${suggestion.anchor}\\b`, 'gi');
      const replacement = `<a href="${suggestion.href}" title="${page.description}" class="text-primary hover:text-accent transition-colors font-medium">${suggestion.anchor}</a>`;
      
      // Only replace first occurrence to avoid over-linking
      optimizedContent = optimizedContent.replace(linkPattern, replacement);
    }
  });
  
  return optimizedContent;
}

/**
 * Get navigation context for current page
 */
export function getNavigationContext(pathname: string): {
  parent?: PageRelationship;
  siblings: PageRelationship[];
  children: PageRelationship[];
} {
  const allPages = Object.values(SITE_STRUCTURE);
  
  // Services have /services as parent
  if (pathname.startsWith('/services/')) {
    const parent = SITE_STRUCTURE['/services'];
    const siblings = allPages.filter(page => 
      page.href.startsWith('/services/') && page.href !== pathname
    );
    
    return { parent, siblings, children: [] };
  }
  
  // Blog posts have /blog as parent
  if (pathname.startsWith('/blog/') && pathname !== '/blog') {
    const parent = SITE_STRUCTURE['/blog'];
    return { parent, siblings: [], children: [] };
  }
  
  // TIL entries have /til as parent
  if (pathname.startsWith('/til/') && pathname !== '/til') {
    const parent = SITE_STRUCTURE['/til'];
    return { parent, siblings: [], children: [] };
  }
  
  // Top-level pages
  const siblings = allPages.filter(page => 
    !page.href.includes('/', 1) && page.href !== pathname
  );
  
  return { siblings, children: [] };
}

/**
 * Analytics tracking for internal links
 */
export function trackInternalLink(linkText: string, destination: string, source: string): void {
  // Google Analytics 4 event tracking
  if (typeof gtag !== 'undefined') {
    gtag('event', 'internal_link_click', {
      link_text: linkText,
      link_destination: destination,
      source_page: source,
      event_category: 'navigation'
    });
  }
  
  // Console log for development
  if (import.meta.env.DEV) {
    console.log('Internal link clicked:', { linkText, destination, source });
  }
}