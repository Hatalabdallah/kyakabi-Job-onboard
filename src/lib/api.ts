const API_BASE_URL = "http://localhost:5002/api";

export interface Candidate {
  id: string;
  candidateId: string;
  email: string;
  role: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interview_scheduled' | 'approved' | 'rejected';
  submitted: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: CandidateProfile;
  interviewDate?: string;
  interviewLink?: string;
  interviewNotes?: string;
}

export interface CandidateProfile {
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp?: string;
  gender: string;
  dateOfBirth?: string;
  city: string;
  country: string;
  nationality: string;
  currentTitle: string;
  yearsExperience: string;
  skills: string[];
  certifications: string[];
  coverLetter?: string;
  cvUrl?: string;
  portfolioUrl?: string;
  certificatesUrl?: string[];
}

export const api = {
  async login(loginId: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }
    return response.json();
  },

  async signup(data: { email: string; password: string; role: string }) {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }
    return response.json();
  },

  async saveProfile(candidateId: string, profileData: any, files: { 
    cv?: File; 
    portfolio?: File;
    certificates?: File[];
  }) {
    const formData = new FormData();
    
    formData.append('data', JSON.stringify(profileData));
    
    if (files.cv) {
      formData.append('cv', files.cv);
    }
    if (files.portfolio) {
      formData.append('portfolio', files.portfolio);
    }
    if (files.certificates) {
      files.certificates.forEach(file => {
        formData.append('certificates', file);
      });
    }

    const response = await fetch(`${API_BASE_URL}/profile/${candidateId}`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Profile save failed");
    }
    return response.json();
  },

  async getCandidates() {
    const response = await fetch(`${API_BASE_URL}/candidates`);
    if (!response.ok) throw new Error("Failed to fetch candidates");
    return response.json();
  },

  async updateStatus(id: string, data: {
    status: Candidate['status'];
    interviewDate?: string;
    interviewLink?: string;
    interviewNotes?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Status update failed");
    }
    return response.json();
  },

  async deleteCandidate(id: string) {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Delete failed");
    }
    return response.json();
  },
  
  async adminLogin(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Admin login failed");
    }
    return response.json();
  }
};