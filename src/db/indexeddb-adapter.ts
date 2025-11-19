// IndexedDB implementation of the storage adapter

import { StorageAdapter } from './storage-adapter';
import type { Resume, ResumeVersion, Job, Application, ModelConfig } from './types';

const DB_NAME = 'GapGiraffeDB';
const DB_VERSION = 1;

export class IndexedDBAdapter extends StorageAdapter {
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores (tables)
        if (!db.objectStoreNames.contains('resumes')) {
          const resumeStore = db.createObjectStore('resumes', { keyPath: 'id', autoIncrement: true });
          resumeStore.createIndex('is_master', 'is_master', { unique: false });
        }

        if (!db.objectStoreNames.contains('resume_versions')) {
          const versionStore = db.createObjectStore('resume_versions', { keyPath: 'id', autoIncrement: true });
          versionStore.createIndex('resume_id', 'resume_id', { unique: false });
          versionStore.createIndex('job_id', 'job_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id', autoIncrement: true });
          jobStore.createIndex('url', 'url', { unique: true });
        }

        if (!db.objectStoreNames.contains('applications')) {
          const appStore = db.createObjectStore('applications', { keyPath: 'id', autoIncrement: true });
          appStore.createIndex('job_id', 'job_id', { unique: false });
          appStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('model_configs')) {
          const modelStore = db.createObjectStore('model_configs', { keyPath: 'id', autoIncrement: true });
          modelStore.createIndex('is_default', 'is_default', { unique: false });
          
          // Add default Gemini Flash config
          const transaction = event.target as IDBTransaction;
          const store = transaction.objectStore?.('model_configs');
          if (store) {
            store.add({
              provider: 'gemini',
              model_name: 'gemini-1.5-flash',
              api_key: null,
              cost_per_token: null,
              is_default: true,
              is_active: true,
              created_at: new Date().toISOString()
            });
          }
        }

        console.log('IndexedDB schema created');
      };
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getObjectStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // ==================== RESUME OPERATIONS ====================

  async createResume(resume: Omit<Resume, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resumes', 'readwrite');
      const request = store.add(resume);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getResume(id: number): Promise<Resume | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resumes');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllResumes(): Promise<Resume[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resumes');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getMasterResume(): Promise<Resume | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resumes');
      const index = store.index('is_master');
      const request = index.openCursor(IDBKeyRange.only(true));
      request.onsuccess = () => {
        const cursor = request.result;
        resolve(cursor ? cursor.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateResume(id: number, updates: Partial<Resume>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const existing = await this.getResume(id);
      if (!existing) {
        reject(new Error('Resume not found'));
        return;
      }

      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
      const store = this.getObjectStore('resumes', 'readwrite');
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteResume(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resumes', 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== JOB OPERATIONS ====================

  async createJob(job: Omit<Job, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('jobs', 'readwrite');
      const request = store.add(job);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getJob(id: number): Promise<Job | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('jobs');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getJobByUrl(url: string): Promise<Job | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('jobs');
      const index = store.index('url');
      const request = index.get(url);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllJobs(): Promise<Job[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('jobs');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateJob(id: number, updates: Partial<Job>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const existing = await this.getJob(id);
      if (!existing) {
        reject(new Error('Job not found'));
        return;
      }

      const updated = { ...existing, ...updates };
      const store = this.getObjectStore('jobs', 'readwrite');
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== RESUME VERSION OPERATIONS ====================

  async createResumeVersion(version: Omit<ResumeVersion, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resume_versions', 'readwrite');
      const request = store.add(version);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getResumeVersionsForJob(jobId: number): Promise<ResumeVersion[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resume_versions');
      const index = store.index('job_id');
      const request = index.getAll(jobId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getResumeVersionsForResume(resumeId: number): Promise<ResumeVersion[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('resume_versions');
      const index = store.index('resume_id');
      const request = index.getAll(resumeId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== APPLICATION OPERATIONS ====================

  async createApplication(application: Omit<Application, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('applications', 'readwrite');
      const request = store.add(application);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getApplication(id: number): Promise<Application | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('applications');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getApplicationsForJob(jobId: number): Promise<Application[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('applications');
      const index = store.index('job_id');
      const request = index.getAll(jobId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllApplications(): Promise<Application[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('applications');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateApplication(id: number, updates: Partial<Application>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const existing = await this.getApplication(id);
      if (!existing) {
        reject(new Error('Application not found'));
        return;
      }

      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
      const store = this.getObjectStore('applications', 'readwrite');
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== MODEL CONFIG OPERATIONS ====================

  async getDefaultModel(): Promise<ModelConfig | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('model_configs');
      const index = store.index('is_default');
      const request = index.openCursor(IDBKeyRange.only(true));
      request.onsuccess = () => {
        const cursor = request.result;
        resolve(cursor ? cursor.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllModelConfigs(): Promise<ModelConfig[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('model_configs');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async createModelConfig(config: Omit<ModelConfig, 'id'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('model_configs', 'readwrite');
      const request = store.add(config);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateModelConfig(id: number, updates: Partial<ModelConfig>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const existing = await this.getModelConfig(id);
      if (!existing) {
        reject(new Error('Model config not found'));
        return;
      }

      const updated = { ...existing, ...updates };
      const store = this.getObjectStore('model_configs', 'readwrite');
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getModelConfig(id: number): Promise<ModelConfig | null> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('model_configs');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
}
