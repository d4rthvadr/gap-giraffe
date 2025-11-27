// Resume Parser - Extract structured data from resume text

export interface ParsedResume {
  rawText: string;
  sections: {
    summary?: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    skills: string[];
    certifications?: string[];
  };
  metadata: {
    parsedAt: string;
    confidence: number; // 0-100
    format: 'text' | 'pdf' | 'docx';
  };
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year?: string;
  gpa?: string;
}

export class ResumeParser {
  /**
   * Parse resume text into structured sections
   */
  static parse(text: string, format: 'text' | 'pdf' | 'docx' = 'text'): ParsedResume {
    const sections = {
      summary: this.extractSummary(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      skills: this.extractSkills(text),
      certifications: this.extractCertifications(text)
    };

    const confidence = this.calculateConfidence(sections);

    return {
      rawText: text,
      sections,
      metadata: {
        parsedAt: new Date().toISOString(),
        confidence,
        format
      }
    };
  }

  /**
   * Extract summary/objective section
   */
  private static extractSummary(text: string): string | undefined {
    const summaryPatterns = [
      /(?:summary|objective|profile|about)\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:experience|education|skills|work history))/i,
      /^([\s\S]{100,500})(?=\n\s*(?:experience|education|skills))/i
    ];

    for (const pattern of summaryPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract work experience entries
   */
  private static extractExperience(text: string): ExperienceEntry[] {
    const experiences: ExperienceEntry[] = [];
    
    // Find experience section
    const expSection = text.match(
      /(?:experience|work history|employment)\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:education|skills|certifications|$))/i
    );

    if (!expSection) return experiences;

    const expText = expSection[1];
    
    // Split by job entries (look for company/title patterns)
    const jobPattern = /([^\n]+)\s*(?:at|@|-)\s*([^\n]+)\s*\n([^\n]*(?:present|current|\d{4})[\s\S]*?)(?=\n[A-Z]|$)/gi;
    
    let match;
    while ((match = jobPattern.exec(expText)) !== null) {
      const [, title, company, details] = match;
      
      // Extract duration
      const durationMatch = details.match(/(\w+\s+\d{4})\s*(?:-|to)\s*(\w+\s+\d{4}|present|current)/i);
      
      experiences.push({
        title: title.trim(),
        company: company.trim(),
        duration: durationMatch ? `${durationMatch[1]} - ${durationMatch[2]}` : 'Unknown',
        description: details.trim(),
        current: /present|current/i.test(details)
      });
    }

    return experiences;
  }

  /**
   * Extract education entries
   */
  private static extractEducation(text: string): EducationEntry[] {
    const education: EducationEntry[] = [];
    
    const eduSection = text.match(
      /(?:education|academic|qualifications)\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:experience|skills|certifications|$))/i
    );

    if (!eduSection) return education;

    const eduText = eduSection[1];
    
    // Match degree patterns
    const degreePattern = /(Bachelor|Master|PhD|Associate|B\.?S\.?|M\.?S\.?|MBA|B\.?A\.?|M\.?A\.?)[^\n]*\n?([^\n]+)/gi;
    
    let match;
    while ((match = degreePattern.exec(eduText)) !== null) {
      const [fullMatch, degree, institution] = match;
      const yearMatch = fullMatch.match(/\b(19|20)\d{2}\b/);
      
      education.push({
        degree: degree.trim(),
        institution: institution.trim(),
        year: yearMatch ? yearMatch[0] : undefined
      });
    }

    return education;
  }

  /**
   * Extract skills
   */
  private static extractSkills(text: string): string[] {
    const skills: string[] = [];
    
    const skillsSection = text.match(
      /(?:skills|technologies|technical skills|competencies)\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:experience|education|certifications|$))/i
    );

    if (!skillsSection) {
      // Fallback: extract common tech keywords from entire text
      return this.extractTechKeywords(text);
    }

    const skillsText = skillsSection[1];
    
    // Split by common delimiters
    const skillList = skillsText.split(/[,•\n\|]/);
    
    for (const skill of skillList) {
      const cleaned = skill.trim();
      if (cleaned.length > 2 && cleaned.length < 50) {
        skills.push(cleaned);
      }
    }

    return skills;
  }

  /**
   * Extract certifications
   */
  private static extractCertifications(text: string): string[] | undefined {
    const certs: string[] = [];
    
    const certsSection = text.match(
      /(?:certifications?|licenses?)\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:experience|education|skills|$))/i
    );

    if (!certsSection) return undefined;

    const certsText = certsSection[1];
    const certList = certsText.split(/\n/);
    
    for (const cert of certList) {
      const cleaned = cert.trim().replace(/^[•\-\*]\s*/, '');
      if (cleaned.length > 3) {
        certs.push(cleaned);
      }
    }

    return certs.length > 0 ? certs : undefined;
  }

  /**
   * Extract common tech keywords as fallback
   */
  private static extractTechKeywords(text: string): string[] {
    const commonTech = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
      'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
      'Git', 'CI/CD', 'Agile', 'Scrum'
    ];

    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const tech of commonTech) {
      if (lowerText.includes(tech.toLowerCase())) {
        found.push(tech);
      }
    }

    return found;
  }

  /**
   * Calculate parsing confidence based on sections found
   */
  private static calculateConfidence(sections: ParsedResume['sections']): number {
    let score = 0;
    
    if (sections.summary) score += 20;
    if (sections.experience.length > 0) score += 30;
    if (sections.education.length > 0) score += 20;
    if (sections.skills.length > 0) score += 20;
    if (sections.certifications && sections.certifications.length > 0) score += 10;

    return Math.min(score, 100);
  }
}
