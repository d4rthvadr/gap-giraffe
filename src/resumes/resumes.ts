// Resume Manager Page Logic

import { ResumeService } from '../resume/resume-service';
import type { ParsedResume } from '../resume/resume-parser';
import type { Resume } from '../db/types';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Resume manager loaded');

  // Get DOM elements
  const uploadArea = document.getElementById('upload-area') as HTMLDivElement;
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const browseBtn = document.getElementById('browse-btn') as HTMLButtonElement;
  const uploadStatus = document.getElementById('upload-status') as HTMLDivElement;
  const resumeList = document.getElementById('resume-list') as HTMLDivElement;
  const previewSection = document.getElementById('preview-section') as HTMLElement;

  let selectedResumeId: number | null = null;

  // Load existing resumes
  await loadResumes();

  // Browse button click
  browseBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
      await handleFileUpload(fileInput.files[0]);
      fileInput.value = ''; // Reset input
    }
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  // Set master button
  document.getElementById('set-master-btn')?.addEventListener('click', async () => {
    if (selectedResumeId) {
      await setMasterResume(selectedResumeId);
    }
  });

  // Delete button
  document.getElementById('delete-resume-btn')?.addEventListener('click', async () => {
    if (selectedResumeId && confirm('Are you sure you want to delete this resume?')) {
      await deleteResume(selectedResumeId);
    }
  });

  /**
   * Handle file upload
   */
  async function handleFileUpload(file: File): Promise<void> {
    try {
      showStatus('Uploading and parsing resume...', 'info');
      
      const { resumeId, parsed } = await ResumeService.uploadResume(file);
      
      showStatus(
        `✓ Resume uploaded successfully! Confidence: ${parsed.metadata.confidence}%`,
        'success'
      );

      // Reload resume list
      await loadResumes();
      
      // Show preview
      await showResumePreview(resumeId);
      
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Upload failed';
      showStatus(`✗ ${message}`, 'error');
    }
  }

  /**
   * Load all resumes
   */
  async function loadResumes(): Promise<void> {
    try {
      const resumes = await ResumeService.getAllResumes();
      
      if (resumes.length === 0) {
        resumeList.innerHTML = '<div class="loading">No resumes uploaded yet</div>';
        return;
      }

      resumeList.innerHTML = resumes.map(({ resume, parsed }) => `
        <div class="resume-card ${resume.is_master ? 'master' : ''}" data-id="${resume.id}">
          <div class="resume-header">
            <div class="resume-name">${resume.name}</div>
            <div class="resume-badges">
              ${resume.is_master ? '<span class="badge master-badge">Master</span>' : ''}
              <span class="badge confidence-badge">${parsed.metadata.confidence}%</span>
              <span class="badge format-badge">${parsed.metadata.format.toUpperCase()}</span>
            </div>
          </div>
          <div class="resume-meta">
            Uploaded: ${new Date(resume.created_at).toLocaleDateString()}
            • ${parsed.sections.experience.length} jobs
            • ${parsed.sections.skills.length} skills
          </div>
        </div>
      `).join('');

      // Add click handlers
      resumeList.querySelectorAll('.resume-card').forEach(card => {
        card.addEventListener('click', async () => {
          const id = parseInt(card.getAttribute('data-id') || '0');
          await showResumePreview(id);
        });
      });

    } catch (error) {
      console.error('Error loading resumes:', error);
      resumeList.innerHTML = '<div class="loading">Error loading resumes</div>';
    }
  }

  /**
   * Show resume preview
   */
  async function showResumePreview(resumeId: number): Promise<void> {
    try {
      selectedResumeId = resumeId;
      
      const result = await ResumeService.getAllResumes();
      const item = result.find(r => r.resume.id === resumeId);
      
      if (!item) return;

      const { resume, parsed } = item;

      // Update preview header
      (document.getElementById('preview-name') as HTMLElement).textContent = resume.name;
      (document.getElementById('preview-confidence') as HTMLElement).textContent = 
        `${parsed.metadata.confidence}% confidence`;
      (document.getElementById('preview-format') as HTMLElement).textContent = 
        parsed.metadata.format.toUpperCase();

      // Summary
      const summaryBlock = document.getElementById('preview-summary-block') as HTMLElement;
      if (parsed.sections.summary) {
        summaryBlock.classList.remove('hidden');
        (document.getElementById('preview-summary') as HTMLElement).textContent = 
          parsed.sections.summary;
      } else {
        summaryBlock.classList.add('hidden');
      }

      // Experience
      const expContainer = document.getElementById('preview-experience') as HTMLElement;
      expContainer.innerHTML = parsed.sections.experience.map(exp => `
        <div class="experience-entry">
          <div class="entry-title">${exp.title}</div>
          <div class="entry-company">${exp.company}</div>
          <div class="entry-duration">${exp.duration}</div>
          <div class="entry-description">${exp.description.substring(0, 200)}...</div>
        </div>
      `).join('') || '<p>No experience listed</p>';

      // Education
      const eduContainer = document.getElementById('preview-education') as HTMLElement;
      eduContainer.innerHTML = parsed.sections.education.map(edu => `
        <div class="education-entry">
          <div class="entry-title">${edu.degree}</div>
          <div class="entry-company">${edu.institution}</div>
          ${edu.year ? `<div class="entry-duration">${edu.year}</div>` : ''}
        </div>
      `).join('') || '<p>No education listed</p>';

      // Skills
      const skillsContainer = document.getElementById('preview-skills') as HTMLElement;
      skillsContainer.innerHTML = parsed.sections.skills.map(skill => 
        `<span class="skill-tag">${skill}</span>`
      ).join('') || '<p>No skills listed</p>';

      // Certifications
      const certsBlock = document.getElementById('preview-certs-block') as HTMLElement;
      if (parsed.sections.certifications && parsed.sections.certifications.length > 0) {
        certsBlock.classList.remove('hidden');
        const certsContainer = document.getElementById('preview-certs') as HTMLElement;
        certsContainer.innerHTML = parsed.sections.certifications.map(cert => 
          `<div class="entry-title">• ${cert}</div>`
        ).join('');
      } else {
        certsBlock.classList.add('hidden');
      }

      // Show preview section
      previewSection.classList.remove('hidden');
      previewSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Error showing preview:', error);
    }
  }

  /**
   * Set resume as master
   */
  async function setMasterResume(resumeId: number): Promise<void> {
    try {
      await ResumeService.setMasterResume(resumeId);
      showStatus('✓ Master resume updated', 'success');
      await loadResumes();
      await showResumePreview(resumeId);
    } catch (error) {
      console.error('Error setting master:', error);
      showStatus('✗ Failed to set master resume', 'error');
    }
  }

  /**
   * Delete resume
   */
  async function deleteResume(resumeId: number): Promise<void> {
    try {
      await ResumeService.deleteResume(resumeId);
      showStatus('✓ Resume deleted', 'success');
      previewSection.classList.add('hidden');
      selectedResumeId = null;
      await loadResumes();
    } catch (error) {
      console.error('Error deleting resume:', error);
      showStatus('✗ Failed to delete resume', 'error');
    }
  }

  /**
   * Show status message
   */
  function showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    uploadStatus.textContent = message;
    uploadStatus.className = `status-message ${type === 'info' ? '' : type}`;
    
    setTimeout(() => {
      uploadStatus.classList.add('hidden');
    }, 5000);
  }
});
