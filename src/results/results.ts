// Results Page Logic

import { db } from '../db/database';
import type { Job } from '../db/types';
import type { JobAnalysisResult } from '../ai/types';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Results page loaded');

  // Get job ID from URL params
  const params = new URLSearchParams(window.location.search);
  const jobId = parseInt(params.get('jobId') || '0');

  if (!jobId) {
    showError('No job ID provided');
    return;
  }

  await loadAndDisplayResults(jobId);
});

/**
 * Load job and analysis results
 */
async function loadAndDisplayResults(jobId: number): Promise<void> {
  try {
    // Initialize database
    await db.initialize();

    // Get job from database
    const job = await db.getJob(jobId);
    
    if (!job) {
      showError('Job not found');
      return;
    }

    // Display job info
    displayJobInfo(job);

    // Parse and display analysis
    if (job.analysis_result) {
      const analysis: JobAnalysisResult = JSON.parse(job.analysis_result);
      displayAnalysis(analysis);
    } else {
      showError('No analysis results available');
    }

  } catch (error) {
    console.error('Error loading results:', error);
    showError('Failed to load results');
  }
}

/**
 * Display job information
 */
function displayJobInfo(job: Job): void {
  const titleEl = document.getElementById('job-title') as HTMLElement;
  const companyEl = document.getElementById('job-company') as HTMLElement;
  const viewJobBtn = document.getElementById('view-job-btn') as HTMLAnchorElement;

  titleEl.textContent = job.title;
  companyEl.textContent = job.company || 'Company not specified';
  viewJobBtn.href = job.url;
}

/**
 * Display analysis results
 */
function displayAnalysis(analysis: JobAnalysisResult): void {
  // Display match score
  displayMatchScore(analysis.matchScore, analysis.analysis);

  // Display missing skills
  displaySkills('missing-skills', analysis.missingSkills, 'missing');

  // Display strengths
  displaySkills('strengths', analysis.strengths, 'strength');

  // Display requirements
  displaySkills('requirements', analysis.keyRequirements, 'requirement');

  // Display suggestions
  displaySuggestions(analysis.suggestions);
}

/**
 * Display match score with animated gauge
 */
function displayMatchScore(score: number, analysis: { technicalFit: number; experienceFit: number; culturalFit: number }): void {
  const scoreEl = document.getElementById('match-score') as HTMLElement;
  const gaugeFill = document.getElementById('gauge-fill') as unknown as SVGCircleElement;

  // Animate score
  animateValue(scoreEl, 0, score, 1000);

  // Animate gauge (565 is full circle circumference)
  const offset = 565 - (565 * score) / 100;
  setTimeout(() => {
    gaugeFill.style.strokeDashoffset = offset.toString();
  }, 100);

  // Set gauge color based on score
  const color = getScoreColor(score);
  gaugeFill.style.stroke = color;

  // Display fit scores
  displayFitScore('technical-fit', 'technical-score', analysis.technicalFit);
  displayFitScore('experience-fit', 'experience-score', analysis.experienceFit);
  displayFitScore('cultural-fit', 'cultural-score', analysis.culturalFit);
}

/**
 * Display individual fit score
 */
function displayFitScore(barId: string, scoreId: string, score: number): void {
  const bar = document.getElementById(barId) as HTMLElement;
  const scoreEl = document.getElementById(scoreId) as HTMLElement;

  setTimeout(() => {
    bar.style.width = `${score}%`;
  }, 100);

  animateValue(scoreEl, 0, score, 800);
}

/**
 * Get color based on score
 */
function getScoreColor(score: number): string {
  if (score >= 76) return '#10b981'; // Green
  if (score >= 51) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
}

/**
 * Animate number value
 */
function animateValue(element: HTMLElement, start: number, end: number, duration: number): void {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current).toString();
  }, 16);
}

/**
 * Display skill tags
 */
function displaySkills(containerId: string, skills: string[], type: 'missing' | 'strength' | 'requirement'): void {
  const container = document.getElementById(containerId) as HTMLElement;

  if (!skills || skills.length === 0) {
    container.innerHTML = '<div class="empty-state">None identified</div>';
    return;
  }

  container.innerHTML = skills.map(skill => 
    `<span class="skill-tag ${type}">${escapeHtml(skill)}</span>`
  ).join('');
}

/**
 * Display optimization suggestions
 */
function displaySuggestions(suggestions: any[]): void {
  const container = document.getElementById('suggestions-list') as HTMLElement;

  if (!suggestions || suggestions.length === 0) {
    container.innerHTML = '<div class="empty-state">No suggestions available</div>';
    return;
  }

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = suggestions.sort((a, b) => 
    priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
  );

  container.innerHTML = sorted.map(suggestion => `
    <div class="suggestion-card">
      <div class="suggestion-header">
        <div class="suggestion-meta">
          <span class="priority-badge ${suggestion.priority}">${suggestion.priority.toUpperCase()}</span>
          <span class="section-badge">${suggestion.section}</span>
        </div>
        <span class="impact-score">+${suggestion.impact} pts</span>
      </div>
      <div class="suggestion-content">
        <strong>${suggestion.type === 'add' ? 'Add:' : suggestion.type === 'modify' ? 'Modify:' : 'Action:'}</strong>
        <p>${escapeHtml(suggestion.suggested)}</p>
      </div>
      <div class="suggestion-reason">
        💡 ${escapeHtml(suggestion.reason)}
      </div>
    </div>
  `).join('');
}

/**
 * Show error message
 */
function showError(message: string): void {
  const main = document.querySelector('main') as HTMLElement;
  main.innerHTML = `
    <div class="empty-state" style="padding: 60px 20px;">
      <h2 style="color: #ef4444; margin-bottom: 16px;">⚠️ ${message}</h2>
      <button class="secondary-btn" onclick="window.close()">Close</button>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Action button handlers
document.getElementById('save-application-btn')?.addEventListener('click', () => {
  // TODO: Implement save to applications (Stage 5)
  alert('Application tracking coming in Stage 5!');
});

document.getElementById('analyze-another-btn')?.addEventListener('click', () => {
  window.close();
});
