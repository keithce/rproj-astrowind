/**
 * Content Optimization Utilities
 * Tools for improving content readability and SEO performance
 */

export interface ContentOptimization {
  original: string;
  optimized: string;
  improvements: string[];
  metrics: {
    before: ReadabilityScore;
    after: ReadabilityScore;
  };
}

export interface ReadabilityScore {
  fleschScore: number;
  avgSentenceLength: number;
  passiveVoiceCount: number;
  readingLevel: string;
}

/**
 * SEO-optimized content templates
 */
export const CONTENT_TEMPLATES = {
  serviceHero: {
    title: '[Service Name]: [Primary Benefit]',
    subtitle: '[Problem Statement]. [Solution Promise]. [Target Audience].',
    example:
      'Professional Audio Mixing: Get Radio-Ready Sound. Turn your rough tracks into polished hits. Perfect for independent artists and producers.',
  },

  featureDescription: {
    format: '[Action Verb] + [Specific Benefit] + [How/Why]',
    example: 'Streamline your workflow with automated task management that saves 5+ hours per week.',
  },

  processStep: {
    format: '[Step Name]: [What Happens] + [Your Benefit]',
    example: 'Discovery Call: We learn about your goals and current challenges so we can create the perfect solution.',
  },

  testimonial: {
    format: '[Specific Result] + [How It Felt] + [Recommendation]',
    example:
      'My workflow time cut in half. I finally feel organized and in control. I recommend Keith to any creative professional.',
  },
};

/**
 * Common readability improvements
 */
export const READABILITY_FIXES = {
  // Sentence length reduction
  longSentences: [
    {
      pattern: /^(.{80,}?),\s+(and|but|or|so)\s+(.+)$/,
      fix: (match: string, p1: string, conjunction: string, p3: string) =>
        `${p1}. ${conjunction === 'and' ? 'Also, ' : conjunction === 'but' ? 'However, ' : ''}${p3.charAt(0).toUpperCase()}${p3.slice(1)}`,
    },
  ],

  // Passive voice conversion
  passiveVoice: [
    {
      pattern: /(.*)\s+(?:was|were|is|are|been|being)\s+(\w+ed)\s+by\s+(.*)/,
      fix: (match: string, subject: string, verb: string, agent: string) =>
        `${agent} ${verb.replace('ed', '')} ${subject}`,
    },
  ],

  // Complex word simplification
  wordSimplification: {
    utilize: 'use',
    demonstrate: 'show',
    facilitate: 'help',
    methodology: 'method',
    implementation: 'setup',
    optimization: 'improvement',
    comprehensive: 'complete',
    subsequently: 'then',
    approximately: 'about',
    frequently: 'often',
    immediately: 'right away',
    professional: 'expert',
    specifications: 'details',
    requirements: 'needs',
  },
};

/**
 * SEO content optimization
 */
export const SEO_OPTIMIZATION = {
  // Title tag optimization
  titleFormulas: [
    '[Primary Keyword] + [Benefit] + [Location/Brand]',
    '[Service] for [Target Audience] | [Benefit] | [Brand]',
    '[Problem Solution] | [Service] | [Brand]',
  ],

  // Meta description templates
  metaDescriptionFormulas: [
    '[Problem] + [Solution] + [Benefit] + [CTA] (150-160 chars)',
    '[Service] for [Audience]. [Key Benefit]. [Social Proof]. [CTA].',
    'Get [Outcome] with [Service]. [Unique Value Prop]. [CTA] today.',
  ],

  // Header optimization
  headerStructure: {
    h1: 'Primary keyword + benefit (50-60 chars)',
    h2: 'Major topics/services (30-50 chars)',
    h3: 'Specific features/details (20-40 chars)',
    h4: 'Supporting information (15-30 chars)',
  },
};

/**
 * Content revision functions
 */
export function optimizeSentenceLength(text: string, maxLength: number = 20): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      const words = sentence.split(' ');
      if (words.length > maxLength) {
        // Find natural break points
        const conjunctions = ['and', 'but', 'or', 'so', 'because', 'although'];
        const breakIndex = words.findIndex((word, i) => i > 5 && conjunctions.includes(word.toLowerCase()));

        if (breakIndex > 0) {
          const firstPart = words.slice(0, breakIndex).join(' ');
          const secondPart = words.slice(breakIndex + 1).join(' ');
          return `${firstPart}. ${secondPart.charAt(0).toUpperCase()}${secondPart.slice(1)}`;
        }
      }
      return sentence;
    })
    .join(' ');
}

export function convertPassiveToActive(text: string): string {
  // Common passive voice patterns
  const patterns = [
    {
      // "was done by X" -> "X did"
      regex: /(.*?)\s+(?:was|were)\s+(\w+ed)\s+by\s+(.+?)(\.|,|$)/g,
      replacement: (match: string, subject: string, verb: string, agent: string, punctuation: string) => {
        const activeVerb = verb.replace(/ed$/, '');
        return `${agent} ${activeVerb} ${subject}${punctuation}`;
      },
    },
    {
      // "is being done by X" -> "X is doing"
      regex: /(.*?)\s+(?:is|are)\s+being\s+(\w+ed)\s+by\s+(.+?)(\.|,|$)/g,
      replacement: (match: string, subject: string, verb: string, agent: string, punctuation: string) => {
        const activeVerb = verb.replace(/ed$/, 'ing');
        return `${agent} is ${activeVerb} ${subject}${punctuation}`;
      },
    },
  ];

  let optimizedText = text;
  patterns.forEach(({ regex, replacement }) => {
    optimizedText = optimizedText.replace(regex, replacement);
  });

  return optimizedText;
}

export function simplifyVocabulary(text: string): string {
  let simplified = text;

  Object.entries(READABILITY_FIXES.wordSimplification).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi');
    simplified = simplified.replace(regex, simple);
  });

  return simplified;
}

export function optimizeParagraphStructure(text: string): string {
  return (
    text
      // Break long paragraphs at natural points
      .split('\n\n')
      .map((paragraph) => {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);

        // If paragraph has more than 4 sentences, break it up
        if (sentences.length > 4) {
          const midPoint = Math.ceil(sentences.length / 2);
          return [sentences.slice(0, midPoint).join(' '), sentences.slice(midPoint).join(' ')].join('\n\n');
        }

        return paragraph;
      })
      .join('\n\n')
  );
}

/**
 * Generate content alternatives
 */
export function generateContentAlternatives(originalText: string): {
  version: string;
  description: string;
  text: string;
  improvements: string[];
}[] {
  return [
    {
      version: 'Simplified Language',
      description: 'Reduces complex words and technical jargon',
      text: simplifyVocabulary(originalText),
      improvements: ['Simpler word choices', 'More accessible language', 'Broader audience appeal'],
    },
    {
      version: 'Active Voice',
      description: 'Converts passive voice to active for stronger impact',
      text: convertPassiveToActive(originalText),
      improvements: ['More direct communication', 'Stronger action words', 'Better engagement'],
    },
    {
      version: 'Shorter Sentences',
      description: 'Breaks up long sentences for better readability',
      text: optimizeSentenceLength(originalText, 18),
      improvements: ['Easier to scan', 'Better comprehension', 'Mobile-friendly'],
    },
    {
      version: 'Optimized Structure',
      description: 'Improves paragraph breaks and flow',
      text: optimizeParagraphStructure(originalText),
      improvements: ['Better visual hierarchy', 'Improved scannability', 'Logical flow'],
    },
  ];
}
