// Application Tracker Logic

import { db } from '../db/database';
import type { Application, Job } from '../db/types';

// State
let applications: Application[] = [];
let jobs: Map<number, Job> = new Map();
let currentView: 'list' | 'board' = 'list';
let searchQuery: string = '';
let statusFilter: string = 'all';
let sortBy: string = 'recent';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Tracker page loaded');
  await initialize();
});

/**
 * Initialize tracker page
 */
async function initialize(): Promise<void> {
  try {
    // Initialize database
    await db.initialize();

    // Load applications and jobs
    await loadData();

    // Setup event listeners
    setupEventListeners();

    // Render initial view
    renderApplications();

  } catch (error) {
    console.error('Failed to initialize tracker:', error);
    showError('Failed to load applications');
  }
}

/**
 * Load applications and related jobs
 */
async function loadData(): Promise<void> {
  // Load all applications
  applications = await db.getAllApplications();
  console.log(`Loaded ${applications.length} applications`);

  // Load related jobs
  const jobIds = [...new Set(applications.map(app => app.job_id))];
  for (const jobId of jobIds) {
    const job = await db.getJob(jobId);
    if (job) {
      jobs.set(jobId, job);
    }
  }

  // Hide loading, show content
  const loadingEl = document.getElementById('loading-state');
  if (loadingEl) loadingEl.classList.add('hidden');
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // View toggle
  const viewToggleBtn = document.getElementById('view-toggle-btn');
  viewToggleBtn?.addEventListener('click', toggleView);

  // Search
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchInput?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
    renderApplications();
  });

  // Status filter
  const statusFilterEl = document.getElementById('status-filter') as HTMLSelectElement;
  statusFilterEl?.addEventListener('change', (e) => {
    statusFilter = (e.target as HTMLSelectElement).value;
    renderApplications();
  });

  // Sort
  const sortByEl = document.getElementById('sort-by') as HTMLSelectElement;
  sortByEl?.addEventListener('change', (e) => {
    sortBy = (e.target as HTMLSelectElement).value;
    renderApplications();
  });

  // Analyze job button
  const analyzeBtn = document.getElementById('analyze-job-btn');
  analyzeBtn?.addEventListener('click', () => {
    window.close();
  });

  // Analytics toggle
  const showAnalyticsBtn = document.getElementById('show-analytics-btn');
  const closeAnalyticsBtn = document.getElementById('close-analytics-btn');
  const analyticsSection = document.getElementById('analytics-section');
  const btnText = showAnalyticsBtn?.querySelector('span');

  showAnalyticsBtn?.addEventListener('click', () => {
    const isHidden = analyticsSection?.classList.contains('hidden');
    
    if (isHidden) {
      analyticsSection?.classList.remove('hidden');
      updateAnalytics();
      analyticsSection?.scrollIntoView({ behavior: 'smooth' });
      if (btnText) btnText.textContent = '📊 Hide Analytics';
    } else {
      analyticsSection?.classList.add('hidden');
      if (btnText) btnText.textContent = '📊 View Analytics';
    }
  });

  closeAnalyticsBtn?.addEventListener('click', () => {
    analyticsSection?.classList.add('hidden');
    if (btnText) btnText.textContent = '📊 View Analytics';
  });
}

/**
 * Update analytics dashboard
 */
async function updateAnalytics(): Promise<void> {
  const stats = await db.getApplicationStats();
  
  // Update Funnel
  const total = stats.total;
  const applied = stats.byStatus.applied + stats.byStatus.screening + stats.byStatus.interview_scheduled + stats.byStatus.interview_completed + stats.byStatus.offer + stats.byStatus.accepted + stats.byStatus.rejected + stats.byStatus.withdrawn;
  const interview = stats.byStatus.interview_scheduled + stats.byStatus.interview_completed + stats.byStatus.offer + stats.byStatus.accepted + stats.byStatus.rejected; // Approximation
  const offer = stats.byStatus.offer + stats.byStatus.accepted;

  updateFunnelBar('total', total, total);
  updateFunnelBar('applied', applied, total);
  updateFunnelBar('interview', interview, total);
  updateFunnelBar('offer', offer, total);

  // Update Time Metrics
  const timeInterviewEl = document.getElementById('metric-time-interview');
  const timeOfferEl = document.getElementById('metric-time-offer');
  const responseRateEl = document.getElementById('metric-response-rate');

  if (timeInterviewEl) timeInterviewEl.textContent = stats.averageTimeToInterview ? `${Math.round(stats.averageTimeToInterview)} days` : '--';
  if (timeOfferEl) timeOfferEl.textContent = stats.averageTimeToOffer ? `${Math.round(stats.averageTimeToOffer)} days` : '--';
  
  // Calculate response rate (screening+ / applied)
  const responses = applied - stats.byStatus.applied; // Anyone who moved past 'applied'
  const responseRate = applied > 0 ? Math.round((responses / applied) * 100) : 0;
  if (responseRateEl) responseRateEl.textContent = `${responseRate}%`;

  // Update Status Breakdown
  updateStatusBreakdown(stats.byStatus, total);
}

function updateFunnelBar(stage: string, value: number, total: number): void {
  const bar = document.querySelector(`.funnel-bar[data-stage="${stage}"]`) as HTMLElement;
  const valueEl = document.getElementById(`funnel-${stage}`);
  
  if (valueEl) valueEl.textContent = value.toString();
  
  if (bar) {
    if (total > 0) {
      const percentage = (value / total) * 100;
      bar.style.width = `${percentage}%`;
    } else {
      bar.style.width = '0%';
    }
  }
}

function updateStatusBreakdown(byStatus: Record<string, number>, total: number): void {
  Object.entries(byStatus).forEach(([status, count]) => {
    // Map DB status to UI ID
    let uiId = status;
    if (status === 'interview_scheduled' || status === 'interview_completed') uiId = 'interview';
    if (status === 'accepted' || status === 'rejected' || status === 'withdrawn') uiId = 'closed';

    const bar = document.getElementById(`breakdown-${uiId}`);
    const countEl = document.getElementById(`count-breakdown-${uiId}`);
    
    // Aggregate counts for grouped statuses
    let displayCount = count;
    if (uiId === 'interview') {
      displayCount = byStatus.interview_scheduled + byStatus.interview_completed;
    } else if (uiId === 'closed') {
      displayCount = byStatus.accepted + byStatus.rejected + byStatus.withdrawn;
    }

    if (countEl) countEl.textContent = displayCount.toString();
    
    if (bar && total > 0) {
      const percentage = (displayCount / total) * 100;
      bar.style.width = `${percentage}%`;
    }
  });
}

/**
 * Toggle between list and board view
 */
function toggleView(): void {
  currentView = currentView === 'list' ? 'board' : 'list';
  
  const listView = document.getElementById('list-view');
  const boardView = document.getElementById('board-view');
  const viewIcon = document.getElementById('view-icon');
  const viewText = document.getElementById('view-text');

  if (currentView === 'board') {
    listView?.classList.add('hidden');
    boardView?.classList.remove('hidden');
    if (viewIcon) viewIcon.textContent = '📋';
    if (viewText) viewText.textContent = 'List View';
  } else {
    listView?.classList.remove('hidden');
    boardView?.classList.add('hidden');
    if (viewIcon) viewIcon.textContent = '📊';
    if (viewText) viewText.textContent = 'Board View';
  }

  renderApplications();
}

/**
 * Render applications based on current view
 */
function renderApplications(): void {
  const filtered = filterAndSortApplications();

  if (currentView === 'list') {
    renderListView(filtered);
  } else {
    renderBoardView(filtered);
  }

  updateStats();
  updateEmptyState(filtered.length === 0);
}

/**
 * Filter and sort applications
 */
function filterAndSortApplications(): Application[] {
  let filtered = [...applications];

  // Apply status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(app => app.status === statusFilter);
  }

  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(app => {
      const job = jobs.get(app.job_id);
      if (!job) return false;

      const searchableText = `${job.title} ${job.company || ''}`.toLowerCase();
      return searchableText.includes(searchQuery);
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'oldest':
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      case 'score':
        const jobA = jobs.get(a.job_id);
        const jobB = jobs.get(b.job_id);
        return (jobB?.match_score || 0) - (jobA?.match_score || 0);
      case 'company':
        const companyA = jobs.get(a.job_id)?.company || '';
        const companyB = jobs.get(b.job_id)?.company || '';
        return companyA.localeCompare(companyB);
      default:
        return 0;
    }
  });

  return filtered;
}

/**
 * Render list view
 */
function renderListView(apps: Application[]): void {
  const container = document.getElementById('applications-list');
  if (!container) return;

  // Remove existing cards
  const existingCards = container.querySelectorAll('.application-card');
  existingCards.forEach(card => card.remove());

  // Add application cards
  apps.forEach(app => {
    const job = jobs.get(app.job_id);
    if (!job) return;

    const card = createApplicationCard(app, job);
    container.appendChild(card);
  });
}

/**
 * Render board view
 */
function renderBoardView(apps: Application[]): void {
  // Group by status
  const grouped = {
    saved: apps.filter(a => a.status === 'saved'),
    applied: apps.filter(a => a.status === 'applied'),
    screening: apps.filter(a => a.status === 'screening'),
    interview_scheduled: apps.filter(a => a.status === 'interview_scheduled' || a.status === 'interview_completed'),
    offer: apps.filter(a => a.status === 'offer'),
    closed: apps.filter(a => a.status === 'accepted' || a.status === 'rejected' || a.status === 'withdrawn')
  };

  // Render each column
  Object.entries(grouped).forEach(([status, statusApps]) => {
    const column = document.getElementById(`column-${status}`);
    const count = document.getElementById(`count-${status}`);

    if (column) {
      column.innerHTML = '';
      statusApps.forEach(app => {
        const job = jobs.get(app.job_id);
        if (job) {
          const card = createBoardCard(app, job);
          column.appendChild(card);
        }
      });
    }

    if (count) {
      count.textContent = statusApps.length.toString();
    }
  });
}

/**
 * Create application card for list view
 */
function createApplicationCard(app: Application, job: Job): HTMLElement {
  const card = document.createElement('div');
  card.className = 'application-card';
  card.dataset.appId = app.id?.toString();

  const statusText = app.status.replace('_', ' ');
  const updatedDate = new Date(app.updated_at).toLocaleDateString();
  const matchScore = job.match_score || 0;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-title">
        <h3>${escapeHtml(job.title)}</h3>
        <p>${escapeHtml(job.company || 'Company not specified')}</p>
      </div>
      <div class="card-meta">
        ${matchScore > 0 ? `<span class="match-score">${matchScore}% Match</span>` : ''}
        <span class="status-badge ${app.status}">${statusText}</span>
      </div>
    </div>
    <div class="card-footer">
      <span class="card-date">Updated ${updatedDate}</span>
      <div class="card-actions">
        <button class="icon-btn" data-action="view" title="View Details">👁️</button>
        <button class="icon-btn" data-action="edit" title="Update Status">✏️</button>
      </div>
    </div>
  `;

  // Event listeners
  card.querySelector('[data-action="view"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    viewJobDetails(job.id!);
  });

  card.querySelector('[data-action="edit"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    editApplication(app.id!);
  });

  card.addEventListener('click', () => {
    viewJobDetails(job.id!);
  });

  return card;
}

/**
 * Create board card for kanban view
 */
function createBoardCard(app: Application, job: Job): HTMLElement {
  const card = document.createElement('div');
  card.className = 'board-card';
  card.dataset.appId = app.id?.toString();

  const updatedDate = new Date(app.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const matchScore = job.match_score || 0;

  card.innerHTML = `
    <h4>${escapeHtml(job.title)}</h4>
    <p>${escapeHtml(job.company || 'Company')}</p>
    <div class="board-card-footer">
      <span>${updatedDate}</span>
      ${matchScore > 0 ? `<span>${matchScore}%</span>` : ''}
    </div>
  `;

  card.addEventListener('click', () => {
    viewJobDetails(job.id!);
  });

  return card;
}

/**
 * Update stats summary
 */
function updateStats(): void {
  const total = applications.length;
  const active = applications.filter(a => 
    !['accepted', 'rejected', 'withdrawn'].includes(a.status)
  ).length;
  
  const offers = applications.filter(a => 
    a.status === 'offer' || a.status === 'accepted'
  ).length;
  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statSuccess = document.getElementById('stat-success');

  if (statTotal) statTotal.textContent = total.toString();
  if (statActive) statActive.textContent = active.toString();
  if (statSuccess) statSuccess.textContent = `${successRate}%`;
}

/**
 * Update empty state visibility
 */
function updateEmptyState(isEmpty: boolean): void {
  const emptyState = document.getElementById('empty-state');
  const listView = document.getElementById('applications-list');

  if (isEmpty) {
    emptyState?.classList.remove('hidden');
    listView?.querySelectorAll('.application-card').forEach(card => card.remove());
  } else {
    emptyState?.classList.add('hidden');
  }
}

/**
 * View job details
 */
function viewJobDetails(jobId: number): void {
  chrome.tabs.create({ 
    url: chrome.runtime.getURL(`results/results.html?jobId=${jobId}`)
  });
}

/**
 * Edit application (open status update modal)
 */
function editApplication(appId: number): void {
  const app = applications.find(a => a.id === appId);
  if (!app) return;

  const job = jobs.get(app.job_id);
  if (!job) return;

  openStatusModal(app, job);
}

/**
 * Open status update modal
 */
function openStatusModal(app: Application, job: Job): void {
  const modal = document.getElementById('status-modal')!;
  const modalJobTitle = document.getElementById('modal-job-title')!;
  const modalJobCompany = document.getElementById('modal-job-company')!;
  const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
  const statusNote = document.getElementById('status-note') as HTMLTextAreaElement;
  const historyList = document.getElementById('history-list')!;

  // Set job info
  modalJobTitle.textContent = job.title;
  modalJobCompany.textContent = job.company || 'Company not specified';

  // Set current status
  statusSelect.value = app.status;
  statusNote.value = '';

  // Render status history
  renderStatusHistory(app, historyList);

  // Show modal
  modal.classList.remove('hidden');

  // Setup modal event listeners
  setupModalListeners(app);
}

/**
 * Render status history
 */
function renderStatusHistory(app: Application, container: HTMLElement): void {
  container.innerHTML = '';

  // Sort history by timestamp (newest first)
  const history = [...app.status_history].sort((a, b) => b.timestamp - a.timestamp);

  history.forEach(entry => {
    const date = new Date(entry.timestamp).toLocaleString();
    const statusText = entry.status.replace('_', ' ');

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-icon">📌</div>
      <div class="history-content">
        <div class="history-status">${escapeHtml(statusText)}</div>
        <div class="history-date">${date}</div>
        ${entry.note ? `<div class="history-note">"${escapeHtml(entry.note)}"</div>` : ''}
      </div>
    `;
    container.appendChild(item);
  });
}

/**
 * Setup modal event listeners
 */
function setupModalListeners(app: Application): void {
  const modal = document.getElementById('status-modal')!;
  const closeBtn = document.getElementById('modal-close-btn')!;
  const cancelBtn = document.getElementById('modal-cancel-btn')!;
  const saveBtn = document.getElementById('modal-save-btn')!;
  const overlay = modal.querySelector('.modal-overlay')!;

  // Close handlers
  const closeModal = () => {
    modal.classList.add('hidden');
    cleanup();
  };

  const cleanup = () => {
    closeBtn.removeEventListener('click', closeModal);
    cancelBtn.removeEventListener('click', closeModal);
    overlay.removeEventListener('click', closeModal);
    saveBtn.removeEventListener('click', saveHandler);
  };

  const saveHandler = async () => {
    await updateApplicationStatus(app);
    closeModal();
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  saveBtn.addEventListener('click', saveHandler);
}

/**
 * Update application status
 */
async function updateApplicationStatus(app: Application): Promise<void> {
  const statusSelect = document.getElementById('status-select') as HTMLSelectElement;
  const statusNote = document.getElementById('status-note') as HTMLTextAreaElement;

  const newStatus = statusSelect.value as Application['status'];
  const note = statusNote.value.trim() || undefined;

  if (newStatus === app.status) {
    return; // No change
  }

  try {
    // Update in database
    await db.updateApplicationStatus(app.id!, newStatus, note);

    // Update local state
    const appIndex = applications.findIndex(a => a.id === app.id);
    if (appIndex >= 0) {
      const updated = await db.getApplication(app.id!);
      if (updated) {
        applications[appIndex] = updated;
      }
    }

    // Re-render
    renderApplications();

    // Show success feedback
    showSuccessToast(`Status updated to ${newStatus.replace('_', ' ')}`);

  } catch (error) {
    console.error('Failed to update status:', error);
    alert('Failed to update status. Please try again.');
  }
}

/**
 * Show success toast notification
 */
function showSuccessToast(message: string): void {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    z-index: 2000;
    animation: slideIn 0.3s ease-out;
    font-weight: 600;
  `;
  toast.textContent = `✓ ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show error message
 */
function showError(message: string): void {
  const container = document.querySelector('.container');
  if (!container) return;

  const error = document.createElement('div');
  error.className = 'empty-state';
  error.innerHTML = `
    <div class="empty-icon">⚠️</div>
    <h2>Error</h2>
    <p>${escapeHtml(message)}</p>
  `;
  
  container.appendChild(error);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
