// Resume Service - Manages resume operations

import { db } from '../db/database';
import { ResumeParser, type ParsedResume } from './resume-parser';
import { FileParser } from './file-parser';
import type { Resume } from '../db/types';

export class ResumeService {
  /**
   * Upload and parse a resume file
   */
  static async uploadResume(file: File, name?: string): Promise<{ resumeId: number; parsed: ParsedResume }> {
    // Ensure database is initialized
    await db.initialize();
    
    // Validate file
    const validation = FileParser.validate(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Parse file to text
    const { text, format } = await FileParser.parse(file);

    // Parse text to structured data
    const parsed = ResumeParser.parse(text, format);

    // Save to database
    const resumeId = await db.createResume({
      name: name || file.name,
      original_content: text,
      file_type: format,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_master: true // First resume is master by default
    });

    console.log('Resume uploaded and parsed:', { resumeId, confidence: parsed.metadata.confidence });

    return { resumeId, parsed };
  }

  /**
   * Get parsed resume by ID
   */
  static async getParsedResume(resumeId: number): Promise<ParsedResume | null> {
    await db.initialize();
    
    const resume = await db.getResume(resumeId);
    if (!resume) return null;

    return ResumeParser.parse(resume.original_content, resume.file_type);
  }

  /**
   * Get master resume
   */
  static async getMasterResume(): Promise<{ resume: Resume; parsed: ParsedResume } | null> {
    await db.initialize();
    
    const resume = await db.getMasterResume();
    if (!resume) return null;

    const parsed = ResumeParser.parse(resume.original_content, resume.file_type);
    return { resume, parsed };
  }

  /**
   * Set a resume as master
   */
  static async setMasterResume(resumeId: number): Promise<void> {
    await db.initialize();
    
    // First, unset all other resumes as master
    const allResumes = await db.getAllResumes();
    for (const resume of allResumes) {
      if (resume.id && resume.is_master) {
        await db.updateResume(resume.id, { is_master: false });
      }
    }

    // Set this resume as master
    await db.updateResume(resumeId, { is_master: true });
  }

  /**
   * Delete a resume
   */
  static async deleteResume(resumeId: number): Promise<void> {
    await db.initialize();
    await db.deleteResume(resumeId);
  }

  /**
   * Get all resumes
   */
  static async getAllResumes(): Promise<Array<{ resume: Resume; parsed: ParsedResume }>> {
    await db.initialize();
    
    const resumes = await db.getAllResumes();
    
    return resumes.map(resume => ({
      resume,
      parsed: ResumeParser.parse(resume.original_content, resume.file_type)
    }));
  }
}
