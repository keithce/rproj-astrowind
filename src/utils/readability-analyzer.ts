/**
 * Content Readability Analysis Utility
 * Analyzes text content for readability metrics and SEO optimization
 */

export interface ReadabilityMetrics {
  sentences: number;
  words: number;
  avgSentenceLength: number;
  avgWordLength: number;
  complexWords: number;
  passiveVoice: number;
  readingLevel: string;
  fleschScore: number;
  recommendations: string[];
}

export interface SEOMetrics {
  headingStructure: Array<{ level: number; text: string; issues: string[] }>;
  keywordDensity: Record<string, number>;
  readability: ReadabilityMetrics;
  contentLength: number;
  internalLinks: number;
  recommendations: string[];
}

class ReadabilityAnalyzer {
  private syllableCount(word: string): number {
    const vowels = 'aeiouy';
    let count = 0;
    let previousIsVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousIsVowel) {
        count++;
      }
      previousIsVowel = isVowel;
    }
    
    // Adjust for silent 'e'
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    return Math.max(1, count);
  }

  private getFleschReadingEase(avgSentenceLength: number, avgSyllables: number): number {
    return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllables);
  }

  private getReadingLevel(fleschScore: number): string {
    if (fleschScore >= 90) return 'Very Easy (5th grade)';
    if (fleschScore >= 80) return 'Easy (6th grade)';
    if (fleschScore >= 70) return 'Fairly Easy (7th grade)';
    if (fleschScore >= 60) return 'Standard (8th-9th grade)';
    if (fleschScore >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (fleschScore >= 30) return 'Difficult (College level)';
    return 'Very Difficult (Graduate level)';
  }

  private detectPassiveVoice(sentence: string): boolean {
    const passiveIndicators = [
      /\b(am|is|are|was|were|being|been|be)\s+\w*ed\b/i,
      /\b(am|is|are|was|were|being|been|be)\s+\w*en\b/i,
      /\bby\s+the\b/i,
      /\bwas\s+\w+ed\s+by\b/i,
      /\bwere\s+\w+ed\s+by\b/i,
    ];
    
    return passiveIndicators.some(pattern => pattern.test(sentence));
  }

  public analyzeText(text: string): ReadabilityMetrics {
    // Clean text
    const cleanText = text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ')
      .trim();

    // Split into sentences
    const sentences = cleanText
      .split(/[.!?]+/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

    // Split into words
    const words = cleanText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);

    // Calculate metrics
    const totalSentences = sentences.length;
    const totalWords = words.length;
    const avgSentenceLength = totalWords / totalSentences;
    
    // Syllable analysis
    const totalSyllables = words.reduce((sum, word) => sum + this.syllableCount(word), 0);
    const avgSyllables = totalSyllables / totalWords;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / totalWords;

    // Complex words (3+ syllables)
    const complexWords = words.filter(word => this.syllableCount(word) >= 3).length;

    // Passive voice detection
    const passiveVoice = sentences.filter(sentence => this.detectPassiveVoice(sentence)).length;

    // Flesch Reading Ease Score
    const fleschScore = this.getFleschReadingEase(avgSentenceLength, avgSyllables);
    const readingLevel = this.getReadingLevel(fleschScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      avgSentenceLength,
      fleschScore,
      passiveVoice,
      totalSentences,
      complexWords,
      totalWords,
    });

    return {
      sentences: totalSentences,
      words: totalWords,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      avgWordLength: Math.round(avgWordLength * 10) / 10,
      complexWords,
      passiveVoice,
      readingLevel,
      fleschScore: Math.round(fleschScore),
      recommendations,
    };
  }

  private generateRecommendations(metrics: {
    avgSentenceLength: number;
    fleschScore: number;
    passiveVoice: number;
    totalSentences: number;
    complexWords: number;
    totalWords: number;
  }): string[] {
    const recommendations = [];

    // Sentence length recommendations
    if (metrics.avgSentenceLength > 20) {
      recommendations.push('Break up long sentences. Aim for 15-20 words per sentence for better readability.');
    }

    // Reading difficulty
    if (metrics.fleschScore < 60) {
      recommendations.push('Simplify language and use shorter words. Target a Flesch score of 60+ for web content.');
    }

    // Passive voice
    const passivePercentage = (metrics.passiveVoice / metrics.totalSentences) * 100;
    if (passivePercentage > 20) {
      recommendations.push('Reduce passive voice usage. Aim for less than 20% passive sentences.');
    }

    // Complex words
    const complexPercentage = (metrics.complexWords / metrics.totalWords) * 100;
    if (complexPercentage > 15) {
      recommendations.push('Use simpler words where possible. Complex words should be less than 15% of total content.');
    }

    // Content length
    if (metrics.totalWords < 300) {
      recommendations.push('Consider expanding content. Pages with 300+ words typically perform better for SEO.');
    } else if (metrics.totalWords > 2000) {
      recommendations.push('Consider breaking content into sections or multiple pages for better user experience.');
    }

    return recommendations;
  }

  public analyzeSEO(content: string, headings: string[]): SEOMetrics {
    const readability = this.analyzeText(content);
    
    // Analyze heading structure
    const headingStructure = this.analyzeHeadings(headings);
    
    // Calculate keyword density
    const keywordDensity = this.calculateKeywordDensity(content);
    
    // Count internal links
    const internalLinks = (content.match(/href="\/[^"]*"/g) || []).length;
    
    // Generate SEO recommendations
    const seoRecommendations = this.generateSEORecommendations({
      readability,
      headingStructure,
      contentLength: content.length,
      internalLinks,
      keywordDensity,
    });

    return {
      headingStructure,
      keywordDensity,
      readability,
      contentLength: content.length,
      internalLinks,
      recommendations: seoRecommendations,
    };
  }

  private analyzeHeadings(headings: string[]): Array<{ level: number; text: string; issues: string[] }> {
    return headings.map((heading, index) => {
      const level = parseInt(heading.match(/^h([1-6])/i)?.[1] || '1');
      const text = heading.replace(/<[^>]*>/g, '').trim();
      const issues = [];

      // Check heading length
      if (text.length > 60) {
        issues.push('Heading too long for SEO (>60 characters)');
      }

      // Check for missing H1 or multiple H1s
      if (level === 1 && index > 0) {
        issues.push('Multiple H1 tags detected');
      }

      // Check heading hierarchy
      if (index > 0) {
        const prevLevel = parseInt(headings[index - 1].match(/^h([1-6])/i)?.[1] || '1');
        if (level > prevLevel + 1) {
          issues.push('Heading hierarchy skips levels');
        }
      }

      return { level, text, issues };
    });
  }

  private calculateKeywordDensity(content: string): Record<string, number> {
    const words = content
      .toLowerCase()
      .replace(/<[^>]*>/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3); // Only count words longer than 3 characters

    const totalWords = words.length;
    const wordCounts: Record<string, number> = {};

    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Calculate density as percentage
    const density: Record<string, number> = {};
    Object.entries(wordCounts).forEach(([word, count]) => {
      const densityPercent = (count / totalWords) * 100;
      if (densityPercent >= 1) { // Only include words with 1%+ density
        density[word] = Math.round(densityPercent * 100) / 100;
      }
    });

    return density;
  }

  private generateSEORecommendations(data: {
    readability: ReadabilityMetrics;
    headingStructure: Array<{ level: number; text: string; issues: string[] }>;
    contentLength: number;
    internalLinks: number;
    keywordDensity: Record<string, number>;
  }): string[] {
    const recommendations = [];

    // Content length
    if (data.contentLength < 1000) {
      recommendations.push('Consider expanding content to 1000+ characters for better SEO performance.');
    }

    // Internal linking
    if (data.internalLinks < 3) {
      recommendations.push('Add more internal links to improve site navigation and SEO.');
    } else if (data.internalLinks > 10) {
      recommendations.push('Consider reducing internal links to avoid appearing spammy.');
    }

    // Heading structure issues
    const headingIssues = data.headingStructure.flatMap(h => h.issues);
    if (headingIssues.length > 0) {
      recommendations.push('Fix heading structure issues for better SEO and accessibility.');
    }

    // Keyword density
    const highDensityKeywords = Object.entries(data.keywordDensity)
      .filter(([_, density]) => density > 3)
      .map(([word]) => word);
    
    if (highDensityKeywords.length > 0) {
      recommendations.push(`Reduce keyword density for: ${highDensityKeywords.join(', ')} (>3% density detected).`);
    }

    return recommendations;
  }
}

export const readabilityAnalyzer = new ReadabilityAnalyzer();

// Content optimization helpers
export function optimizeForReadability(text: string): string {
  return text
    // Break up long sentences at conjunctions
    .replace(/,\s+and\s+/g, '. ')
    .replace(/,\s+but\s+/g, '. However, ')
    .replace(/,\s+so\s+/g, '. Therefore, ')
    // Convert passive to active voice patterns
    .replace(/was\s+(\w+ed)\s+by\s+/g, (match, verb) => {
      // This is a simplified conversion - real implementation would be more complex
      return `${verb.replace('ed', '')} `;
    })
    // Simplify complex phrases
    .replace(/in order to/g, 'to')
    .replace(/due to the fact that/g, 'because')
    .replace(/at this point in time/g, 'now')
    .replace(/a large number of/g, 'many')
    .replace(/prior to/g, 'before');
}

export function generateReadableAlternatives(text: string): string[] {
  const alternatives = [];
  
  // Sentence structure variations
  if (text.length > 100) {
    alternatives.push(
      text.split('. ').join('.\n\n'),
      text.replace(/,\s+(and|but|or)\s+/g, '.\n\n'),
    );
  }
  
  // Active voice alternatives
  const passivePatterns = [
    { pattern: /(\w+)\s+was\s+(\w+ed)\s+by\s+(\w+)/g, replacement: '$3 $2 $1' },
    { pattern: /(\w+)\s+were\s+(\w+ed)\s+by\s+(\w+)/g, replacement: '$3 $2 $1' },
  ];
  
  passivePatterns.forEach(({ pattern, replacement }) => {
    if (pattern.test(text)) {
      alternatives.push(text.replace(pattern, replacement));
    }
  });
  
  return alternatives.filter(alt => alt !== text);
}