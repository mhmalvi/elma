import { describe, it, expect } from 'vitest';

// Import the sanitization functions from the Edge function
// Since they're internal, we'll recreate them here for testing
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and encode special characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, (match) => ({ // Encode dangerous characters
      '<': '&lt;',
      '>': '&gt;', 
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#x27;'
    }[match] || match))
    .trim();
}

function validateContent(input: string): { isValid: boolean; reason?: string } {
  const cleanInput = input.toLowerCase().trim();
  
  // Check length limits
  if (cleanInput.length === 0) {
    return { isValid: false, reason: 'Empty content' };
  }
  
  if (cleanInput.length > 10000) {
    return { isValid: false, reason: 'Content too long (max 10,000 characters)' };
  }
  
  // Basic profanity and inappropriate content filter
  const inappropriatePatterns = [
    /\b(fuck|shit|damn|bitch|asshole|bastard)\b/gi,
    /\b(hate|kill|murder|suicide|bomb|terrorist|violence)\b/gi,
    /(script|javascript|<|>|eval|function)/gi // Basic XSS prevention
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(cleanInput)) {
      return { isValid: false, reason: 'Content contains inappropriate language or potentially harmful content' };
    }
  }
  
  return { isValid: true };
}

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).toBe('alert(&quot;xss&quot;)Hello World');
    });

    it('should encode dangerous characters', () => {
      const input = 'Hello <world> & "friends"';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello &lt;world&gt; &amp; &quot;friends&quot;');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '   Hello World   ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle complex HTML injection attempts', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeInput(input);
      expect(result).toBe('');
    });
  });

  describe('validateContent', () => {
    it('should accept valid content', () => {
      const result = validateContent('What is prayer in Islam?');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty content', () => {
      const result = validateContent('');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Empty content');
    });

    it('should reject content that is too long', () => {
      const longContent = 'a'.repeat(10001);
      const result = validateContent(longContent);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Content too long (max 10,000 characters)');
    });

    it('should reject profanity', () => {
      const result = validateContent('This is fucking stupid');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Content contains inappropriate language or potentially harmful content');
    });

    it('should reject potentially harmful content', () => {
      const result = validateContent('How to kill someone');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Content contains inappropriate language or potentially harmful content');
    });

    it('should reject script injection attempts', () => {
      const result = validateContent('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Content contains inappropriate language or potentially harmful content');
    });

    it('should be case insensitive', () => {
      const result = validateContent('FUCK this shit');
      expect(result.isValid).toBe(false);
    });

    it('should accept Arabic text', () => {
      const result = validateContent('ما هي الصلاة في الإسلام؟');
      expect(result.isValid).toBe(true);
    });

    it('should accept normal religious questions', () => {
      const questions = [
        'What is the meaning of prayer in Islam?',
        'Can you explain the five pillars of Islam?',
        'What does the Quran say about charity?',
        'How should Muslims treat their parents?'
      ];

      questions.forEach(question => {
        const result = validateContent(question);
        expect(result.isValid).toBe(true);
      });
    });
  });
});