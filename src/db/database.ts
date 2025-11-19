// Database manager - simplified to use storage adapter pattern

import { StorageAdapter, StorageEngine, StorageFactory } from './storage-adapter';

class DatabaseManager {
  private adapter: StorageAdapter | null = null;
  private initialized = false;
  private engine: StorageEngine = StorageEngine.INDEXEDDB; // Default to IndexedDB

  /**
   * Initialize the database with specified storage engine
   */
  async initialize(engine: StorageEngine = StorageEngine.INDEXEDDB): Promise<void> {
    if (this.initialized && this.adapter) {
      console.log('Database already initialized');
      return;
    }

    try {
      console.log(`Initializing database with ${engine} storage...`);
      this.engine = engine;
      this.adapter = await StorageFactory.create(engine);
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Get the current storage adapter
   */
  private getAdapter(): StorageAdapter {
    if (!this.adapter) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.adapter;
  }

  // ==================== RESUME OPERATIONS ====================

  async createResume(resume: Parameters<StorageAdapter['createResume']>[0]) {
    return this.getAdapter().createResume(resume);
  }

  async getResume(id: number) {
    return this.getAdapter().getResume(id);
  }

  async getAllResumes() {
    return this.getAdapter().getAllResumes();
  }

  async getMasterResume() {
    return this.getAdapter().getMasterResume();
  }

  async updateResume(id: number, updates: Parameters<StorageAdapter['updateResume']>[1]) {
    return this.getAdapter().updateResume(id, updates);
  }

  async deleteResume(id: number) {
    return this.getAdapter().deleteResume(id);
  }

  // ==================== JOB OPERATIONS ====================

  async createJob(job: Parameters<StorageAdapter['createJob']>[0]) {
    return this.getAdapter().createJob(job);
  }

  async getJob(id: number) {
    return this.getAdapter().getJob(id);
  }

  async getJobByUrl(url: string) {
    return this.getAdapter().getJobByUrl(url);
  }

  async getAllJobs() {
    return this.getAdapter().getAllJobs();
  }

  async updateJob(id: number, updates: Parameters<StorageAdapter['updateJob']>[1]) {
    return this.getAdapter().updateJob(id, updates);
  }

  // ==================== RESUME VERSION OPERATIONS ====================

  async createResumeVersion(version: Parameters<StorageAdapter['createResumeVersion']>[0]) {
    return this.getAdapter().createResumeVersion(version);
  }

  async getResumeVersionsForJob(jobId: number) {
    return this.getAdapter().getResumeVersionsForJob(jobId);
  }

  async getResumeVersionsForResume(resumeId: number) {
    return this.getAdapter().getResumeVersionsForResume(resumeId);
  }

  // ==================== APPLICATION OPERATIONS ====================

  async createApplication(application: Parameters<StorageAdapter['createApplication']>[0]) {
    return this.getAdapter().createApplication(application);
  }

  async getApplication(id: number) {
    return this.getAdapter().getApplication(id);
  }

  async getApplicationsForJob(jobId: number) {
    return this.getAdapter().getApplicationsForJob(jobId);
  }

  async getAllApplications() {
    return this.getAdapter().getAllApplications();
  }

  async updateApplication(id: number, updates: Parameters<StorageAdapter['updateApplication']>[1]) {
    return this.getAdapter().updateApplication(id, updates);
  }

  // ==================== MODEL CONFIG OPERATIONS ====================

  async getDefaultModel() {
    return this.getAdapter().getDefaultModel();
  }

  async getAllModelConfigs() {
    return this.getAdapter().getAllModelConfigs();
  }

  async createModelConfig(config: Parameters<StorageAdapter['createModelConfig']>[0]) {
    return this.getAdapter().createModelConfig(config);
  }

  async updateModelConfig(id: number, updates: Parameters<StorageAdapter['updateModelConfig']>[1]) {
    return this.getAdapter().updateModelConfig(id, updates);
  }

  // ==================== UTILITY ====================

  async close(): Promise<void> {
    if (this.adapter) {
      await this.adapter.close();
      this.adapter = null;
      this.initialized = false;
    }
  }

  getCurrentEngine(): StorageEngine {
    return this.engine;
  }
}

// Export singleton instance
export const db = new DatabaseManager();
export { StorageEngine };
