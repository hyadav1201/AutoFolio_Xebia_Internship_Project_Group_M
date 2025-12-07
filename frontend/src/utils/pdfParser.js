/**
 * Client-side PDF parser fallback when Affinda API is down
 * Uses pdfjs-dist for PDF text extraction and pattern matching for field extraction
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker - using bundled worker for reliability and security
// The worker is bundled with pdfjs-dist package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  /* @vite-ignore */
  import.meta.url
).toString();

/**
 * Extract text from PDF file using PDF.js
 */
export async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async function(e) {
      try {
        const typedArray = new Uint8Array(e.target.result);
        
        const pdf = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        resolve(fullText);
      } catch (error) {
        console.error('PDF text extraction error:', error);
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract structured data from text using pattern matching
 */
export function parseResumeText(text) {
  const extractedData = {
    name: { raw: '' },
    emails: [],
    phoneNumbers: [],
    linkedin: '',
    github: '',
    websites: [],
    education: [],
    workExperience: [],
    skills: [],
    projects: [],
    certifications: [],
    aboutMe: '',
  };

  // Extract email
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    extractedData.emails = [...new Set(emails)]; // Remove duplicates
  }

  // Extract phone numbers (international formats supported)
  // Matches formats: +1-234-567-8900, (123) 456-7890, +44 20 1234 5678, etc.
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?(\(?\d{1,4}\)?[-.\s]?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    // Filter to keep only likely phone numbers (at least 10 digits)
    const validPhones = phones.filter(p => {
      const digits = p.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    });
    extractedData.phoneNumbers = [...new Set(validPhones.map(p => p.trim()))];
  }

  // Extract LinkedIn URL
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/gi;
  const linkedin = text.match(linkedinRegex);
  if (linkedin && linkedin.length > 0) {
    extractedData.linkedin = linkedin[0];
  }

  // Extract GitHub URL
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/gi;
  const github = text.match(githubRegex);
  if (github && github.length > 0) {
    extractedData.github = github[0];
  }

  // Extract all URLs
  const urlRegex = /https?:\/\/[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+/gi;
  const urls = text.match(urlRegex);
  if (urls && urls.length > 0) {
    extractedData.websites = [...new Set(urls)];
  }

  // Extract name (usually first line or line with capitalized words)
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length > 0) {
    // Look for name in first few lines (typically 2-3 words, all caps or title case)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Check if line is 2-4 words and mostly alphabetic
      const words = line.split(/\s+/).filter(w => w.length > 1);
      if (words.length >= 2 && words.length <= 4 && 
          line.match(/^[A-Z][a-zA-Z\s]+$/) && 
          !line.toLowerCase().includes('resume') &&
          !line.toLowerCase().includes('curriculum')) {
        extractedData.name.raw = line;
        break;
      }
    }
  }

  // Extract skills (common technical skills)
  // Define skills with proper regex escaping for special characters
  const skillKeywords = [
    { pattern: 'javascript', display: 'JavaScript' },
    { pattern: 'java', display: 'Java' },
    { pattern: 'python', display: 'Python' },
    { pattern: 'c\\+\\+', display: 'C++' },
    { pattern: 'c#', display: 'C#' },
    { pattern: 'ruby', display: 'Ruby' },
    { pattern: 'php', display: 'PHP' },
    { pattern: 'swift', display: 'Swift' },
    { pattern: 'kotlin', display: 'Kotlin' },
    { pattern: 'typescript', display: 'TypeScript' },
    { pattern: 'golang', display: 'Golang' },
    { pattern: 'rust', display: 'Rust' },
    { pattern: 'scala', display: 'Scala' },
    { pattern: 'react', display: 'React' },
    { pattern: 'angular', display: 'Angular' },
    { pattern: 'vue', display: 'Vue' },
    { pattern: 'node', display: 'Node' },
    { pattern: 'express', display: 'Express' },
    { pattern: 'django', display: 'Django' },
    { pattern: 'flask', display: 'Flask' },
    { pattern: 'spring', display: 'Spring' },
    { pattern: 'asp\\.net', display: 'ASP.NET' },
    { pattern: 'laravel', display: 'Laravel' },
    { pattern: 'mongodb', display: 'MongoDB' },
    { pattern: 'postgresql', display: 'PostgreSQL' },
    { pattern: 'mysql', display: 'MySQL' },
    { pattern: 'redis', display: 'Redis' },
    { pattern: 'docker', display: 'Docker' },
    { pattern: 'kubernetes', display: 'Kubernetes' },
    { pattern: 'aws', display: 'AWS' },
    { pattern: 'azure', display: 'Azure' },
    { pattern: 'gcp', display: 'GCP' },
    { pattern: 'git', display: 'Git' },
    { pattern: 'html', display: 'HTML' },
    { pattern: 'css', display: 'CSS' },
    { pattern: 'sass', display: 'Sass' },
    { pattern: 'webpack', display: 'Webpack' },
    { pattern: 'graphql', display: 'GraphQL' },
    { pattern: 'rest', display: 'REST' },
    { pattern: 'api', display: 'API' },
    { pattern: 'agile', display: 'Agile' },
    { pattern: 'scrum', display: 'Scrum' },
    { pattern: 'jira', display: 'Jira' },
    { pattern: 'jenkins', display: 'Jenkins' },
    { pattern: 'ci/cd', display: 'CI/CD' },
    { pattern: 'tensorflow', display: 'TensorFlow' },
    { pattern: 'pytorch', display: 'PyTorch' },
    { pattern: 'machine learning', display: 'Machine Learning' },
    { pattern: 'deep learning', display: 'Deep Learning' },
    { pattern: 'data science', display: 'Data Science' },
    { pattern: 'analytics', display: 'Analytics' },
    { pattern: 'sql', display: 'SQL' },
    { pattern: 'nosql', display: 'NoSQL' },
    { pattern: 'linux', display: 'Linux' },
    { pattern: 'windows', display: 'Windows' },
  ];
  
  const textLower = text.toLowerCase();
  const foundSkills = [];
  
  skillKeywords.forEach(skill => {
    // Pattern is pre-escaped for regex special characters
    const regex = new RegExp(`\\b${skill.pattern}\\b`, 'gi');
    if (textLower.match(regex)) {
      foundSkills.push(skill.display);
    }
  });
  
  extractedData.skills = [...new Set(foundSkills)].map(name => ({ name }));

  // Extract education (look for degree keywords)
  const educationRegex = /(bachelor|master|phd|doctorate|b\.?s\.?|m\.?s\.?|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?|bca|mca|diploma)[\s\w]*(?:in|of)?\s*[\w\s,]+/gi;
  const educationMatches = text.match(educationRegex);
  if (educationMatches) {
    educationMatches.forEach(match => {
      extractedData.education.push({
        degree: match.trim(),
        institution: '',
        startDate: '',
        endDate: '',
      });
    });
  }

  // Extract work experience (look for job title keywords followed by company)
  const jobTitleKeywords = [
    'engineer', 'developer', 'architect', 'manager', 'analyst', 'consultant',
    'designer', 'lead', 'senior', 'junior', 'intern', 'director', 'specialist',
    'coordinator', 'administrator', 'technician'
  ];
  
  const experienceSection = extractSection(text, ['experience', 'work history', 'employment']);
  if (experienceSection) {
    const expLines = experienceSection.split('\n').filter(Boolean);
    let currentJob = null;
    
    expLines.forEach(line => {
      const lineLower = line.toLowerCase();
      const hasJobTitle = jobTitleKeywords.some(title => lineLower.includes(title));
      
      if (hasJobTitle && line.length < 100) {
        if (currentJob) {
          extractedData.workExperience.push(currentJob);
        }
        currentJob = {
          jobTitle: line.trim(),
          organization: '',
          description: '',
        };
      } else if (currentJob && line.length > 20) {
        // Likely company name or description
        if (!currentJob.organization && line.match(/^[A-Z]/)) {
          currentJob.organization = line.trim();
        } else {
          currentJob.description += line.trim() + ' ';
        }
      }
    });
    
    if (currentJob) {
      extractedData.workExperience.push(currentJob);
    }
  }

  // Extract projects
  const projectSection = extractSection(text, ['projects', 'portfolio']);
  if (projectSection) {
    const projLines = projectSection.split('\n').filter(Boolean);
    let currentProject = null;
    
    projLines.forEach(line => {
      if (line.match(/^[A-Z]/) && line.length < 100 && !line.match(/^(technologies|tech stack|skills)/i)) {
        if (currentProject) {
          extractedData.projects.push(currentProject);
        }
        currentProject = {
          name: line.trim(),
          description: '',
          tech: [],
        };
      } else if (currentProject && line.length > 20) {
        currentProject.description += line.trim() + ' ';
      }
    });
    
    if (currentProject) {
      extractedData.projects.push(currentProject);
    }
  }

  // Extract certifications
  const certSection = extractSection(text, ['certifications', 'certificates', 'licenses']);
  if (certSection) {
    const certLines = certSection.split('\n')
      .filter(line => line.trim().length > 5)
      .filter(line => !line.toLowerCase().includes('view certificate'));
    
    extractedData.certifications = certLines.map(line => line.trim());
  }

  return extractedData;
}

/**
 * Helper: Extract a section from text based on header keywords
 */
function extractSection(text, keywords) {
  const lines = text.split('\n');
  let sectionStart = -1;
  let sectionEnd = lines.length;
  
  // Find section start
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (keywords.some(keyword => lineLower.includes(keyword))) {
      sectionStart = i + 1;
      break;
    }
  }
  
  if (sectionStart === -1) return null;
  
  // Find section end (next section or end of document)
  const sectionHeaders = [
    'experience', 'education', 'skills', 'projects', 'certifications',
    'awards', 'publications', 'interests', 'hobbies', 'references'
  ];
  
  for (let i = sectionStart; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    if (sectionHeaders.some(header => 
      lineLower === header || 
      lineLower.startsWith(header + ':') ||
      (lineLower.length < 30 && lineLower.includes(header))
    )) {
      // Don't include the header we're searching for
      if (!keywords.some(keyword => lineLower.includes(keyword))) {
        sectionEnd = i;
        break;
      }
    }
  }
  
  return lines.slice(sectionStart, sectionEnd).join('\n');
}

/**
 * Main function to parse resume file
 */
export async function parseResumeFile(file) {
  try {
    const text = await extractTextFromPDF(file);
    const extractedData = parseResumeText(text);
    return {
      success: true,
      data: extractedData,
      source: 'client-side',
    };
  } catch (error) {
    console.error('Client-side resume parsing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
