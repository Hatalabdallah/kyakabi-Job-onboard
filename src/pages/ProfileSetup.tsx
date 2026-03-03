import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Briefcase, FileText, Upload, Check, ChevronRight, ChevronLeft,
  Plus, X, AlertCircle, RefreshCw, Star, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveCandidate, setCurrentUser, type Candidate, type CandidateProfile } from "@/lib/storage";
import logoImg from "@/assets/logo.png";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Professional", icon: Briefcase },
  { id: 3, label: "Documents", icon: FileText },
  { id: 4, label: "Review", icon: Check },
];

const SKILLS_OPTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C#", ".NET",
  "Azure", "AWS", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "DevOps",
  "SQL", "PostgreSQL", "MongoDB", "Redis", "GraphQL", "REST APIs", "Microservices",
  "Agile", "Scrum", "PMP", "PRINCE2", "UI/UX", "Figma", "Cybersecurity", "Networking",
  "Linux", "Windows Server", "Active Directory", "SIEM", "Machine Learning", "Data Analytics",
];

const COUNTRIES = ["Uganda", "Kenya", "Tanzania", "Rwanda", "Ethiopia", "Nigeria", "South Africa", "Other"];

interface ProfileSetupProps {
  candidate: Candidate;
  onComplete: (candidate: Candidate) => void;
}

type FileData = { name: string; type: string; data: string; size: number };

export default function ProfileSetup({ candidate, onComplete }: ProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [dragOver, setDragOver] = useState<string | null>(null);

  // Form data
  const [form, setForm] = useState<CandidateProfile>({
    firstName: "", lastName: "", phone: "", whatsapp: "",
    location: "", city: "", country: "Uganda", gender: "", dateOfBirth: "", nationality: "",
    currentTitle: "", yearsExperience: "", skills: [], certifications: [],
    linkedIn: "", portfolio: "", coverLetter: "",
  });

  const [cvFile, setCvFile] = useState<FileData | null>(null);
  const [portfolioFile, setPortfolioFile] = useState<FileData | null>(null);
  const [certFiles, setCertFiles] = useState<FileData[]>([]);

  const update = (field: keyof CandidateProfile, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const fileToData = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve({
        name: file.name, type: file.type,
        data: e.target?.result as string, size: file.size,
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileDrop = useCallback(async (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOver(null);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files, type);
  }, []);

  const processFiles = async (files: File[], type: string) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowed.includes(file.type)) {
        setErrors(prev => ({ ...prev, [type]: 'Invalid file type. Use PDF, DOC, DOCX, JPG, or PNG.' }));
        return;
      }
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, [type]: 'File too large. Max 10MB.' }));
        return;
      }
      const data = await fileToData(file);
      if (type === 'cv') setCvFile(data);
      else if (type === 'portfolio') setPortfolioFile(data);
      else if (type === 'certs') setCertFiles(prev => [...prev, data]);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !form.skills.includes(skill)) {
      update("skills", [...form.skills, skill]);
    }
    setNewSkill("");
  };

  const addCert = () => {
    if (newCert && !form.certifications.includes(newCert)) {
      update("certifications", [...form.certifications, newCert]);
    }
    setNewCert("");
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!form.firstName) newErrors.firstName = "First name is required";
      if (!form.lastName) newErrors.lastName = "Last name is required";
      if (!form.phone) newErrors.phone = "Phone is required";
      if (!form.gender) newErrors.gender = "Gender is required";
      if (!form.city) newErrors.city = "City is required";
      if (!form.country) newErrors.country = "Country is required";
      if (!form.nationality) newErrors.nationality = "Nationality is required";
    }
    if (currentStep === 2) {
      if (!form.currentTitle) newErrors.currentTitle = "Current title is required";
      if (!form.yearsExperience) newErrors.yearsExperience = "Years of experience is required";
      if (form.skills.length === 0) newErrors.skills = "Add at least one skill";
    }
    if (currentStep === 3) {
      if (!cvFile) newErrors.cv = "CV/Resume is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setCurrentStep(s => Math.min(s + 1, 4));
  };

  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));

    const updatedProfile: CandidateProfile = {
      ...form,
      location: `${form.city}, ${form.country}`,
      cvFile: cvFile || undefined,
      portfolioFile: portfolioFile || undefined,
      certificateFiles: certFiles.length > 0 ? certFiles : undefined,
    };

    const updatedCandidate: Candidate = {
      ...candidate,
      profile: updatedProfile,
      submitted: true,
      status: "pending",
      updatedAt: new Date().toISOString(),
    };

    saveCandidate(updatedCandidate);
    setCurrentUser(updatedCandidate);
    setLoading(false);
    onComplete(updatedCandidate);
  };

  const progressPercent = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={logoImg} alt="Kyakabi" className="h-10" />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Applying for</p>
            <p className="text-sm font-semibold text-primary">{candidate.role}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex-1">
        {/* Step Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border z-0">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
            {STEPS.map(step => {
              const Icon = step.icon;
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isDone ? "step-complete" : isActive ? "step-active" : "step-inactive"
                  }`}>
                    {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Step {currentStep} of {STEPS.length}
          </p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="bg-card rounded-2xl shadow-brand border p-6 lg:p-8">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-display font-bold">Personal Information</h2>
                    <p className="text-muted-foreground text-sm mt-1">Tell us about yourself</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">First Name *</Label>
                      <Input className="mt-1.5" placeholder="John" value={form.firstName} onChange={e => update("firstName", e.target.value)} />
                      {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Name *</Label>
                      <Input className="mt-1.5" placeholder="Mukasa" value={form.lastName} onChange={e => update("lastName", e.target.value)} />
                      {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone Number *</Label>
                      <Input className="mt-1.5" placeholder="+256 700 000 000" value={form.phone} onChange={e => update("phone", e.target.value)} />
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">WhatsApp Number</Label>
                      <Input className="mt-1.5" placeholder="+256 700 000 000" value={form.whatsapp} onChange={e => update("whatsapp", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Gender *</Label>
                      <Select value={form.gender} onValueChange={v => update("gender", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          {["Male", "Female", "Prefer not to say"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.gender && <p className="text-destructive text-xs mt-1">{errors.gender}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date of Birth</Label>
                      <Input type="date" className="mt-1.5" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">City *</Label>
                      <Input className="mt-1.5" placeholder="Kampala" value={form.city} onChange={e => update("city", e.target.value)} />
                      {errors.city && <p className="text-destructive text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Country *</Label>
                      <Select value={form.country} onValueChange={v => update("country", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-medium">Nationality *</Label>
                      <Input className="mt-1.5" placeholder="Ugandan" value={form.nationality} onChange={e => update("nationality", e.target.value)} />
                      {errors.nationality && <p className="text-destructive text-xs mt-1">{errors.nationality}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Professional Info */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-display font-bold">Professional Profile</h2>
                    <p className="text-muted-foreground text-sm mt-1">Showcase your expertise</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-medium">Current Job Title *</Label>
                      <Input className="mt-1.5" placeholder="e.g. Senior Software Engineer" value={form.currentTitle} onChange={e => update("currentTitle", e.target.value)} />
                      {errors.currentTitle && <p className="text-destructive text-xs mt-1">{errors.currentTitle}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Years of Experience *</Label>
                      <Select value={form.yearsExperience} onValueChange={v => update("yearsExperience", v)}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {["0-1", "1-2", "2-3", "3-5", "5-8", "8-10", "10+"].map(y => <SelectItem key={y} value={y}>{y} years</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.yearsExperience && <p className="text-destructive text-xs mt-1">{errors.yearsExperience}</p>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">LinkedIn Profile</Label>
                      <Input className="mt-1.5" placeholder="linkedin.com/in/yourprofile" value={form.linkedIn} onChange={e => update("linkedIn", e.target.value)} />
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-primary" /> Skills *
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-xl bg-muted/30">
                      {form.skills.map(skill => (
                        <span key={skill} className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                          {skill}
                          <button type="button" onClick={() => update("skills", form.skills.filter(s => s !== skill))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Select value={newSkill} onValueChange={v => { addSkill(v); }}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Add from list..." /></SelectTrigger>
                        <SelectContent className="max-h-52">
                          {SKILLS_OPTIONS.filter(s => !form.skills.includes(s)).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input placeholder="Custom skill" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))} className="flex-1" />
                      <Button type="button" size="icon" variant="outline" onClick={() => addSkill(newSkill)}><Plus className="h-4 w-4" /></Button>
                    </div>
                    {errors.skills && <p className="text-destructive text-xs mt-1">{errors.skills}</p>}
                  </div>

                  {/* Certifications */}
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-secondary" /> Certifications
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-xl bg-muted/30">
                      {form.certifications.map(cert => (
                        <span key={cert} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs px-3 py-1 rounded-full">
                          {cert}
                          <button type="button" onClick={() => update("certifications", form.certifications.filter(c => c !== cert))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Input placeholder="e.g. AZ-104, PMP, AWS SAA..." value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCert())} />
                      <Button type="button" size="icon" variant="outline" onClick={addCert}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <Label className="text-sm font-medium">Cover Letter / Summary</Label>
                    <Textarea className="mt-1.5 min-h-[120px]" placeholder="Tell us why you're the best candidate for this role..." value={form.coverLetter} onChange={e => update("coverLetter", e.target.value)} />
                  </div>
                </div>
              )}

              {/* Step 3: Documents */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-display font-bold">Upload Documents</h2>
                    <p className="text-muted-foreground text-sm mt-1">Accepted: PDF, DOC, DOCX, JPG, PNG (max 10MB each)</p>
                  </div>

                  {/* CV Upload */}
                  <div>
                    <Label className="text-sm font-medium">CV / Resume *</Label>
                    <div
                      className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
                        dragOver === 'cv' ? "border-primary bg-primary/5" : cvFile ? "border-primary/40 bg-accent/30" : "border-border hover:border-primary/40 hover:bg-muted/50"
                      }`}
                      onDragOver={e => { e.preventDefault(); setDragOver('cv'); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleFileDrop(e, 'cv')}
                      onClick={() => document.getElementById('cv-input')?.click()}
                    >
                      <input id="cv-input" type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={async e => { if (e.target.files?.[0]) await processFiles([e.target.files[0]], 'cv'); }} />
                      {cvFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-foreground">{cvFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(cvFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setCvFile(null); }} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium">Drop your CV here or click to browse</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX up to 10MB</p>
                        </>
                      )}
                    </div>
                    {errors.cv && <p className="text-destructive text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.cv}</p>}
                  </div>

                  {/* Portfolio Upload */}
                  <div>
                    <Label className="text-sm font-medium">Portfolio / Work Sample (Optional)</Label>
                    <div
                      className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                        dragOver === 'portfolio' ? "border-secondary bg-secondary/5" : portfolioFile ? "border-secondary/40 bg-secondary/5" : "border-border hover:border-secondary/40 hover:bg-muted/50"
                      }`}
                      onDragOver={e => { e.preventDefault(); setDragOver('portfolio'); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleFileDrop(e, 'portfolio')}
                      onClick={() => document.getElementById('portfolio-input')?.click()}
                    >
                      <input id="portfolio-input" type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={async e => { if (e.target.files?.[0]) await processFiles([e.target.files[0]], 'portfolio'); }} />
                      {portfolioFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-secondary" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">{portfolioFile.name}</p>
                              <p className="text-xs text-muted-foreground">{(portfolioFile.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setPortfolioFile(null); }} className="text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm font-medium">Portfolio, GitHub, or work samples</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF, JPG up to 10MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Certificates */}
                  <div>
                    <Label className="text-sm font-medium">Certificates (Optional)</Label>
                    <div
                      className="mt-1.5 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/50 transition-all"
                      onClick={() => document.getElementById('cert-input')?.click()}
                    >
                      <input id="cert-input" type="file" accept=".pdf,.jpg,.png" multiple className="hidden" onChange={async e => { if (e.target.files) await processFiles(Array.from(e.target.files), 'certs'); }} />
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs font-medium">Upload certificates</p>
                    </div>
                    {certFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {certFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                            <span className="text-xs font-medium truncate">{f.name}</span>
                            <button onClick={() => setCertFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive ml-2">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-display font-bold">Review & Submit</h2>
                    <p className="text-muted-foreground text-sm mt-1">Review your application before submitting</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Personal</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{form.firstName} {form.lastName}</span></div>
                        <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{form.phone}</span></div>
                        <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{form.city}, {form.country}</span></div>
                        <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{form.gender}</span></div>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Professional</h3>
                      <div className="text-sm space-y-1">
                        <div><span className="text-muted-foreground">Title:</span> <span className="font-medium">{form.currentTitle}</span></div>
                        <div><span className="text-muted-foreground">Experience:</span> <span className="font-medium">{form.yearsExperience} years</span></div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {form.skills.map(s => <span key={s} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{s}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Documents</h3>
                      <div className="text-sm space-y-1">
                        <div className={`flex items-center gap-2 ${cvFile ? "text-primary" : "text-muted-foreground"}`}>
                          <Check className="h-3.5 w-3.5" /> CV: {cvFile?.name || "Not uploaded"}
                        </div>
                        {portfolioFile && <div className="flex items-center gap-2 text-primary"><Check className="h-3.5 w-3.5" /> Portfolio: {portfolioFile.name}</div>}
                        {certFiles.length > 0 && <div className="flex items-center gap-2 text-primary"><Check className="h-3.5 w-3.5" /> {certFiles.length} certificate(s)</div>}
                      </div>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-center">
                      <p className="font-medium text-primary">By submitting, you confirm your application for <strong>{candidate.role}</strong></p>
                      <p className="text-muted-foreground text-xs mt-1">Interviews will be scheduled before 10th March 2026</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {currentStep < 4 ? (
            <Button onClick={nextStep} className="flex-1 font-semibold">
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 h-12 font-semibold text-base">
              {loading ? (
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Submitting...</span>
              ) : (
                <span className="flex items-center gap-2"><Check className="h-5 w-5" /> Submit Application</span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
