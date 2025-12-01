// Storage adapter interface - allows switching between different storage engines

import type { Resume, ResumeVersion, Job, Application, ModelConfig } from './types';

/**
 * Abstract base class for storage adapters
 * Implementations: IndexedDB, SQLite, etc.
 */
export abstract class StorageAdapter {
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;

  // Resume operations
  abstract createResume(resume: Omit<Resume, 'id'>): Promise<number>;
  abstract getResume(id: number): Promise<Resume | null>;
  abstract getAllResumes(): Promise<Resume[]>;
  abstract getMasterResume(): Promise<Resume | null>;
  abstract updateResume(id: number, updates: Partial<Resume>): Promise<void>;
  abstract deleteResume(id: number): Promise<void>;

  // Job operations
  abstract createJob(job: Omit<Job, 'id'>): Promise<number>;
  abstract getJob(id: number): Promise<Job | null>;
  abstract getJobByUrl(url: string): Promise<Job | null>;
  abstract getAllJobs(): Promise<Job[]>;
  abstract updateJob(id: number, updates: Partial<Job>): Promise<void>;

  // Resume version operations
  abstract createResumeVersion(version: Omit<ResumeVersion, 'id'>): Promise<number>;
  abstract getResumeVersionsForJob(jobId: number): Promise<ResumeVersion[]>;
  abstract getResumeVersionsForResume(resumeId: number): Promise<ResumeVersion[]>;

  // Application operations
  abstract createApplication(application: Omit<Application, 'id'>): Promise<number>;
  abstract getApplication(id: number): Promise<Application | null>;
  abstract getApplicationsForJob(jobId: number): Promise<Application[]>;
  abstract getAllApplications(): Promise<Application[]>;
  abstract updateApplication(id: number, updates: Partial<Application>): Promise<void>;
  abstract updateApplicationStatus(id: number, status: Application['status'], note?: string): Promise<void>;
  abstract addReminder(applicationId: number, reminder: Omit<import('./types').Reminder, 'id' | 'created_at'>): Promise<void>;
  abstract completeReminder(applicationId: number, reminderId: string, completed?: boolean): Promise<void>;
  abstract getApplicationsByStatus(status: Application['status']): Promise<Application[]>;
  abstract getApplicationStats(): Promise<{
    total: number;
    byStatus: Record<Application['status'], number>;
    averageTimeToInterview: number | null;
    averageTimeToOffer: number | null;
    successRate: number;
  }>;


  // Model config operations
  abstract getDefaultModel(): Promise<ModelConfig | null>;
  abstract getAllModelConfigs(): Promise<ModelConfig[]>;
  abstract createModelConfig(config: Omit<ModelConfig, 'id'>): Promise<number>;
  abstract updateModelConfig(id: number, updates: Partial<ModelConfig>): Promise<void>;
}

/**
 * Storage engine types
 */
export enum StorageEngine {
  INDEXEDDB = 'indexeddb',
  SQLITE = 'sqlite', // For future use
  CHROME_STORAGE = 'chrome_storage' // For simple key-value storage
}

/**
 * Factory to create storage adapter instances
 */
export class StorageFactory {
  static async create(engine: StorageEngine): Promise<StorageAdapter> {
    switch (engine) {
      case StorageEngine.INDEXEDDB:
        
        const { IndexedDBAdapter } = await import('./indexeddb-adapter');
        const adapter = new IndexedDBAdapter();
        await adapter.initialize();
        return adapter;
      
      case StorageEngine.SQLITE:
        throw new Error('SQLite adapter not implemented yet');
      
      case StorageEngine.CHROME_STORAGE:
        throw new Error('Chrome Storage adapter not implemented yet');
      
      default:
        throw new Error(`Unknown storage engine: ${engine}`);
    }
  }
}
