// Local Storage utilities for Kyakabi Recruitment System

export interface Candidate {
  id: string;
  candidateId: string; // KG-XXXXXX
  email: string;
  password: string; // hashed
  role: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview_scheduled' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  profile?: CandidateProfile;
  interviewDate?: string;
  interviewLink?: string;
  interviewNotes?: string;
  submitted?: boolean;
}

export interface CandidateProfile {
  // Personal
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp?: string;
  location: string;
  city: string;
  country: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;

  // Professional
  currentTitle: string;
  yearsExperience: string;
  skills: string[];
  certifications: string[];
  linkedIn?: string;
  portfolio?: string;
  coverLetter?: string;

  // Documents (stored as base64)
  cvFile?: { name: string; type: string; data: string; size: number };
  portfolioFile?: { name: string; type: string; data: string; size: number };
  certificateFiles?: Array<{ name: string; type: string; data: string; size: number }>;
}

const STORAGE_KEYS = {
  CANDIDATES: 'kyakabi_candidates',
  CURRENT_USER: 'kyakabi_current_user',
  ADMIN_AUTH: 'kyakabi_admin_auth',
  SETTINGS: 'kyakabi_settings',
};

// Hash password (simple for demo - use bcrypt in production)
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `kg_${Math.abs(hash).toString(36)}_${password.length}`;
}

// Generate unique candidate ID
export function generateCandidateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'KG-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Generate secure password
export function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!';
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  // Shuffle
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// CANDIDATE CRUD
export function getCandidates(): Candidate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CANDIDATES);
    return data ? JSON.parse(data) : getSampleCandidates();
  } catch {
    return getSampleCandidates();
  }
}

export function saveCandidate(candidate: Candidate): void {
  const candidates = getCandidates();
  const existing = candidates.findIndex(c => c.id === candidate.id);
  if (existing >= 0) {
    candidates[existing] = { ...candidate, updatedAt: new Date().toISOString() };
  } else {
    candidates.push(candidate);
  }
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
}

export function deleteCandidate(id: string): void {
  const candidates = getCandidates().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(candidates));
}

export function getCandidateByEmail(email: string): Candidate | undefined {
  return getCandidates().find(c => c.email.toLowerCase() === email.toLowerCase());
}

export function getCandidateById(id: string): Candidate | undefined {
  return getCandidates().find(c => c.id === id);
}

export function getCandidateByCandidateId(candidateId: string): Candidate | undefined {
  return getCandidates().find(c => c.candidateId === candidateId);
}

// SESSION
export function getCurrentUser(): Candidate | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function setCurrentUser(candidate: Candidate | null): void {
  if (candidate) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(candidate));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// ADMIN
export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'kyakabi_admin_2024';
}

export function adminLogin(password: string): boolean {
  if (password === 'Admin@KG2024' || password === 'kyakabi2024') {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'kyakabi_admin_2024');
    return true;
  }
  return false;
}

export function adminLogout(): void {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
}

// SAMPLE DATA
function getSampleCandidates(): Candidate[] {
  const samples: Candidate[] = [
    {
      id: 'sample-001',
      candidateId: 'KG-AZ2024',
      email: 'john.mukasa@example.com',
      password: hashPassword('Test@1234'),
      role: 'Azure DevOps Engineer',
      status: 'shortlisted',
      createdAt: '2025-02-15T08:30:00Z',
      updatedAt: '2025-02-20T14:00:00Z',
      submitted: true,
      profile: {
        firstName: 'John', lastName: 'Mukasa',
        phone: '+256700123456', whatsapp: '+256700123456',
        location: 'Kampala, Uganda', city: 'Kampala', country: 'Uganda',
        gender: 'Male', dateOfBirth: '1990-05-15', nationality: 'Ugandan',
        currentTitle: 'Senior DevOps Engineer', yearsExperience: '5',
        skills: ['Azure', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker'],
        certifications: ['AZ-104', 'AZ-400', 'AWS SAA'],
        linkedIn: 'https://linkedin.com/in/johnmukasa',
        coverLetter: 'I am excited to apply for the Azure DevOps Engineer position...',
      },
    },
    {
      id: 'sample-002',
      candidateId: 'KG-SW7832',
      email: 'sarah.nakato@example.com',
      password: hashPassword('Test@5678'),
      role: 'Software Engineer',
      status: 'interview_scheduled',
      createdAt: '2025-02-18T10:00:00Z',
      updatedAt: '2025-02-22T09:30:00Z',
      submitted: true,
      interviewDate: '2026-03-08T10:00:00Z',
      interviewLink: 'https://teams.microsoft.com/l/meetup-join/abc123',
      profile: {
        firstName: 'Sarah', lastName: 'Nakato',
        phone: '+256750987654', whatsapp: '+256750987654',
        location: 'Entebbe, Uganda', city: 'Entebbe', country: 'Uganda',
        gender: 'Female', dateOfBirth: '1993-08-22', nationality: 'Ugandan',
        currentTitle: 'Full Stack Developer', yearsExperience: '4',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
        certifications: ['AWS Developer', 'Google Cloud Professional'],
        linkedIn: 'https://linkedin.com/in/sarahnakato',
      },
    },
    {
      id: 'sample-003',
      candidateId: 'KG-PM9001',
      email: 'david.ochen@example.com',
      password: hashPassword('Test@9012'),
      role: 'Project Manager',
      status: 'pending',
      createdAt: '2025-02-28T14:20:00Z',
      updatedAt: '2025-02-28T14:20:00Z',
      submitted: false,
      profile: {
        firstName: 'David', lastName: 'Ochen',
        phone: '+256782456789', whatsapp: '+256782456789',
        location: 'Jinja, Uganda', city: 'Jinja', country: 'Uganda',
        gender: 'Male', dateOfBirth: '1988-11-03', nationality: 'Ugandan',
        currentTitle: 'IT Project Manager', yearsExperience: '8',
        skills: ['Agile', 'Scrum', 'PMP', 'Stakeholder Management', 'MS Project'],
        certifications: ['PMP', 'PRINCE2', 'Scrum Master'],
        linkedIn: 'https://linkedin.com/in/davidochen',
      },
    },
  ];
  localStorage.setItem(STORAGE_KEYS.CANDIDATES, JSON.stringify(samples));
  return samples;
}

// Initialize sample data on first load
export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.CANDIDATES)) {
    getSampleCandidates();
  }
}
