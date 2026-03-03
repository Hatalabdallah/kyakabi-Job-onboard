import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Filter, Eye, Edit2, Trash2, Calendar, Send, Download,
  CheckCircle, XCircle, Clock, Star, MessageCircle, Mail, BarChart3,
  LogOut, ChevronDown, RefreshCw, Bell, Settings, FileText, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  getCandidates, saveCandidate, deleteCandidate, adminLogout, type Candidate
} from "@/lib/storage";
import {
  sendInterviewEmail, sendApprovalEmail, sendInterviewWhatsApp, getEmailLogs
} from "@/lib/notifications";
import logoImg from "@/assets/logo.png";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: <Clock className="h-3 w-3" /> },
  reviewed: { label: "Reviewed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: <Eye className="h-3 w-3" /> },
  shortlisted: { label: "Shortlisted", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <Star className="h-3 w-3" /> },
  interview_scheduled: { label: "Interview Scheduled", color: "text-primary", bg: "bg-accent border-primary/30", icon: <Calendar className="h-3 w-3" /> },
  approved: { label: "Approved", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: <XCircle className="h-3 w-3" /> },
};

interface AdminPanelProps {
  onLogout: () => void;
}

type ViewTab = "dashboard" | "candidates" | "notifications";

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("dashboard");
  const [candidates, setCandidates] = useState<Candidate[]>(getCandidates());
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "interview" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Interview form
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewLink, setInterviewLink] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  const refreshCandidates = () => setCandidates(getCandidates());

  const roles = useMemo(() => {
    const r = new Set(candidates.map(c => c.role));
    return ["all", ...Array.from(r)];
  }, [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.email.toLowerCase().includes(q) ||
        c.candidateId.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        `${c.profile?.firstName} ${c.profile?.lastName}`.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || c.role === filterRole;
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [candidates, search, filterRole, filterStatus]);

  const stats = useMemo(() => ({
    total: candidates.length,
    pending: candidates.filter(c => c.status === "pending").length,
    shortlisted: candidates.filter(c => c.status === "shortlisted").length,
    interviewed: candidates.filter(c => c.status === "interview_scheduled").length,
    approved: candidates.filter(c => c.status === "approved").length,
    submitted: candidates.filter(c => c.submitted).length,
  }), [candidates]);

  const handleStatusChange = (candidate: Candidate, status: Candidate["status"]) => {
    const updated = { ...candidate, status };
    saveCandidate(updated);
    refreshCandidates();
    if (selectedCandidate?.id === candidate.id) setSelectedCandidate(updated);
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate || !interviewDate || !interviewLink) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));

    const updated: Candidate = {
      ...selectedCandidate,
      status: "interview_scheduled",
      interviewDate,
      interviewLink,
      interviewNotes,
    };
    saveCandidate(updated);

    const name = `${selectedCandidate.profile?.firstName} ${selectedCandidate.profile?.lastName}`.trim();
    const phone = selectedCandidate.profile?.whatsapp || selectedCandidate.profile?.phone || '';

    await sendInterviewEmail({
      to_email: selectedCandidate.email,
      to_name: name,
      role: selectedCandidate.role,
      candidate_id: selectedCandidate.candidateId,
      interview_date: interviewDate,
      interview_link: interviewLink,
    });
    sendInterviewWhatsApp(name, selectedCandidate.role, interviewDate, interviewLink, phone);

    setLoading(false);
    setDialogMode(null);
    refreshCandidates();
    setSuccessMsg(`Interview scheduled and notifications sent to ${name}`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleApprove = async (candidate: Candidate) => {
    const name = `${candidate.profile?.firstName} ${candidate.profile?.lastName}`.trim();
    await sendApprovalEmail({
      to_email: candidate.email,
      to_name: name,
      role: candidate.role,
      candidate_id: candidate.candidateId,
    });
    handleStatusChange(candidate, "approved");
    setSuccessMsg(`Approval email sent to ${name}`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleDelete = () => {
    if (!selectedCandidate) return;
    deleteCandidate(selectedCandidate.id);
    setDialogMode(null);
    setSelectedCandidate(null);
    refreshCandidates();
  };

  const downloadCV = (candidate: Candidate) => {
    if (!candidate.profile?.cvFile) return;
    const link = document.createElement('a');
    link.href = candidate.profile.cvFile.data;
    link.download = candidate.profile.cvFile.name;
    link.click();
  };

  const handleAdminLogout = () => {
    adminLogout();
    onLogout();
  };

  const emailLogs = getEmailLogs();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar flex-col shadow-lg">
        <div className="p-6 border-b border-sidebar-border">
          <img src={logoImg} alt="Kyakabi" className="h-10 brightness-0 invert" />
          <p className="text-sidebar-foreground/60 text-xs mt-2">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "candidates", label: "Candidates", icon: Users, badge: stats.total },
            { id: "notifications", label: "Notifications", icon: Bell, badge: emailLogs.length },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ViewTab)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-secondary text-secondary-foreground text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button onClick={handleAdminLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-all">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={logoImg} alt="Kyakabi" className="h-8 lg:hidden" />
            <div>
              <h1 className="font-display font-bold text-lg text-foreground capitalize">{activeTab}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Kyakabi Group Recruitment Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {successMsg && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="hidden sm:flex items-center gap-2 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> {successMsg}
              </motion.div>
            )}
            {/* Mobile nav */}
            <div className="flex lg:hidden gap-1">
              {[
                { id: "dashboard", icon: BarChart3 },
                { id: "candidates", icon: Users },
                { id: "notifications", icon: Bell },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id as ViewTab)}
                    className={`p-2 rounded-lg ${activeTab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
              <button onClick={handleAdminLogout} className="p-2 rounded-lg text-muted-foreground"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {/* DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                  {[
                    { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-card", icon: "👥" },
                    { label: "Submitted", value: stats.submitted, color: "text-blue-600", bg: "bg-blue-50", icon: "📋" },
                    { label: "Pending", value: stats.pending, color: "text-yellow-600", bg: "bg-yellow-50", icon: "⏳" },
                    { label: "Shortlisted", value: stats.shortlisted, color: "text-purple-600", bg: "bg-purple-50", icon: "⭐" },
                    { label: "Interviews", value: stats.interviewed, color: "text-primary", bg: "bg-accent", icon: "📅" },
                    { label: "Approved", value: stats.approved, color: "text-green-600", bg: "bg-green-50", icon: "✅" },
                  ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className={`${stat.bg} rounded-2xl p-4 border shadow-sm`}>
                      <div className="text-2xl mb-1">{stat.icon}</div>
                      <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Candidates */}
                <div className="bg-card rounded-2xl border shadow-sm">
                  <div className="p-5 border-b flex items-center justify-between">
                    <h2 className="font-display font-bold text-base">Recent Applications</h2>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("candidates")}>View All</Button>
                  </div>
                  <div className="divide-y">
                    {candidates.slice(0, 5).map(c => {
                      const config = STATUS_CONFIG[c.status];
                      const name = c.profile ? `${c.profile.firstName} ${c.profile.lastName}` : c.email;
                      return (
                        <div key={c.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                              {name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">{c.role} · {c.candidateId}</p>
                            </div>
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* CANDIDATES */}
            {activeTab === "candidates" && (
              <motion.div key="candidates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Filters */}
                <div className="bg-card rounded-2xl border p-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by name, ID, email, role..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="sm:w-48"><Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r === "all" ? "All Roles" : r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{filtered.length} candidate(s) found</p>
                </div>

                {/* Table */}
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">CANDIDATE</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">ROLE</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">STATUS</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">APPLIED</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filtered.map(c => {
                          const config = STATUS_CONFIG[c.status];
                          const name = c.profile ? `${c.profile.firstName} ${c.profile.lastName}` : c.email;
                          return (
                            <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                                    {name[0]?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{c.candidateId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <p className="text-sm text-muted-foreground truncate max-w-[160px]">{c.role}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Select value={c.status} onValueChange={(v) => handleStatusChange(c, v as Candidate["status"])}>
                                  <SelectTrigger className={`h-7 text-xs font-medium w-auto border gap-1 ${config.bg} ${config.color}`}>
                                    {config.icon}<SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => { setSelectedCandidate(c); setDialogMode("view"); }} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="View">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => { setSelectedCandidate(c); setInterviewDate(c.interviewDate || ""); setInterviewLink(c.interviewLink || ""); setInterviewNotes(c.interviewNotes || ""); setDialogMode("interview"); }} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Schedule Interview">
                                    <Calendar className="h-4 w-4" />
                                  </button>
                                  {c.profile?.cvFile && (
                                    <button onClick={() => downloadCV(c)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Download CV">
                                      <Download className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button onClick={() => { setSelectedCandidate(c); setDialogMode("delete"); }} className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filtered.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No candidates found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS LOG */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-card rounded-2xl border shadow-sm">
                  <div className="p-5 border-b"><h2 className="font-display font-bold">Email & Notification Log</h2></div>
                  {emailLogs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No notifications sent yet</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {emailLogs.map((log: Record<string, string>) => (
                        <div key={log.id} className="p-4 flex items-start gap-3 hover:bg-muted/20">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{log.subject}</p>
                            <p className="text-xs text-muted-foreground">To: {log.to} · {log.candidateId}</p>
                            <p className="text-xs text-muted-foreground">{new Date(log.sentAt).toLocaleString()}</p>
                          </div>
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Sent</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* View Dialog */}
      <Dialog open={dialogMode === "view"} onOpenChange={o => !o && setDialogMode(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-xl">
                  {(selectedCandidate.profile?.firstName || selectedCandidate.email)[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedCandidate.profile ? `${selectedCandidate.profile.firstName} ${selectedCandidate.profile.lastName}` : selectedCandidate.email}</h3>
                  <p className="text-muted-foreground text-sm">{selectedCandidate.role}</p>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{selectedCandidate.candidateId}</span>
                </div>
              </div>

              {selectedCandidate.profile && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: "Email", value: selectedCandidate.email },
                      { label: "Phone", value: selectedCandidate.profile.phone },
                      { label: "WhatsApp", value: selectedCandidate.profile.whatsapp },
                      { label: "Location", value: `${selectedCandidate.profile.city}, ${selectedCandidate.profile.country}` },
                      { label: "Title", value: selectedCandidate.profile.currentTitle },
                      { label: "Experience", value: `${selectedCandidate.profile.yearsExperience} years` },
                    ].map(item => item.value ? (
                      <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-medium text-sm mt-0.5">{item.value}</p>
                      </div>
                    ) : null)}
                  </div>
                  {selectedCandidate.profile.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.profile.skills.map(s => (
                          <span key={s} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedCandidate.profile.coverLetter && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Cover Letter</p>
                      <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{selectedCandidate.profile.coverLetter}</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-2">
                {selectedCandidate.profile?.cvFile && (
                  <Button variant="outline" size="sm" onClick={() => downloadCV(selectedCandidate)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download CV
                  </Button>
                )}
                <Button size="sm" onClick={() => handleApprove(selectedCandidate)} className="ml-auto">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Approve & Notify
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Interview Dialog */}
      <Dialog open={dialogMode === "interview"} onOpenChange={o => !o && setDialogMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="bg-accent/50 rounded-xl p-3 text-sm">
                <p className="font-medium">{selectedCandidate.profile?.firstName} {selectedCandidate.profile?.lastName}</p>
                <p className="text-muted-foreground text-xs">{selectedCandidate.role} · {selectedCandidate.candidateId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Interview Date & Time *</Label>
                <Input type="datetime-local" className="mt-1.5" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium">Meeting Link *</Label>
                <Input placeholder="https://teams.microsoft.com/..." className="mt-1.5" value={interviewLink} onChange={e => setInterviewLink(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea placeholder="Interview instructions, panel members..." className="mt-1.5" value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">Email & WhatsApp notifications will be sent automatically.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button onClick={handleScheduleInterview} disabled={loading || !interviewDate || !interviewLink}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Schedule & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialogMode === "delete"} onOpenChange={o => !o && setDialogMode(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Candidate</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{selectedCandidate?.profile?.firstName || selectedCandidate?.email}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogMode(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
