import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Briefcase, ChevronRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getCandidateByEmail,
  hashPassword,
  generateCandidateId,
  generatePassword,
  saveCandidate,
  setCurrentUser,
  getCandidateByCandidateId,
  type Candidate,
} from "@/lib/storage";
import { sendSignupEmail, sendSignupWhatsApp } from "@/lib/notifications";
import logoImg from "@/assets/logo.png";

const ROLES = [
  "Azure DevOps Engineer",
  "Software Engineer",
  "Project Manager",
  "Data Analyst",
  "Cloud Architect",
  "Cybersecurity Specialist",
  "UI/UX Designer",
  "Business Analyst",
  "Network Engineer",
  "IT Support Specialist",
  "Other",
];

interface AuthPageProps {
  onLogin: (candidate: Candidate) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login state
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [generatedCreds, setGeneratedCreds] = useState<{ candidateId: string; password: string } | null>(null);
  const [signupStep, setSignupStep] = useState<"form" | "credentials">("form");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const candidates = [
      getCandidateByCandidateId(loginId.toUpperCase()),
      ...(!loginId.includes('-') ? [{ email: loginId } as Candidate] : []),
    ].filter(Boolean);

    const candidate = getCandidateByCandidateId(loginId.toUpperCase()) ||
      (loginId.includes('@') ? candidates[0] : null);

    const byEmail = loginId.includes('@') ? getCandidateByEmail(loginId) : null;
    const user = candidate || byEmail;

    if (!user) {
      setError("Invalid Candidate ID or email. Please check and try again.");
      setLoading(false);
      return;
    }

    const hashed = hashPassword(loginPass);
    if (user.password !== hashed) {
      setError("Incorrect password. Please try again.");
      setLoading(false);
      return;
    }

    setCurrentUser(user);
    setLoading(false);
    onLogin(user);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!signupEmail || !signupPassword || !selectedRole) {
      setError("Please fill in all required fields.");
      return;
    }
    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (getCandidateByEmail(signupEmail)) {
      setError("An account with this email already exists.");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));

    const candidateId = generateCandidateId();
    const generatedPass = generatePassword();

    const newCandidate: Candidate = {
      id: `cand-${Date.now()}`,
      candidateId,
      email: signupEmail,
      password: hashPassword(signupPassword),
      role: selectedRole,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCandidate(newCandidate);
    setGeneratedCreds({ candidateId, password: generatedPass });

    // Send notifications
    await sendSignupEmail({
      to_email: signupEmail,
      to_name: signupEmail.split('@')[0],
      role: selectedRole,
      candidate_id: candidateId,
      generated_password: signupPassword,
    });
    sendSignupWhatsApp(signupEmail.split('@')[0], candidateId, selectedRole, signupPassword);

    setLoading(false);
    setSignupStep("credentials");
  };

  const proceedToProfile = () => {
    const candidate = getCandidateByEmail(signupEmail)!;
    setCurrentUser(candidate);
    onLogin(candidate);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden gradient-hero flex-col items-center justify-center p-12"
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 animate-float" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white/5" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-4 w-24 h-24 rounded-full bg-brand-orange/20 animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 text-center">
          <motion.img
            src={logoImg}
            alt="Kyakabi Group"
            className="w-64 mx-auto mb-8 drop-shadow-2xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          />
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            Recruitment Portal
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-sm mx-auto leading-relaxed">
            Join Uganda's most innovative technology group. Apply for exciting roles and shape the future.
          </p>
          <div className="flex flex-col gap-4 text-left">
            {[
              { icon: "🏢", text: "Top-tier technology roles in Uganda & East Africa" },
              { icon: "🚀", text: "Fast-track career growth programs" },
              { icon: "🌍", text: "Remote & hybrid work opportunities" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white/90 text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col min-h-screen bg-background">
        {/* Mobile header */}
        <div className="lg:hidden gradient-hero p-6 flex items-center gap-4">
          <img src={logoImg} alt="Kyakabi Group" className="h-12" />
          <div>
            <h2 className="text-white font-display font-bold text-lg">Kyakabi Group</h2>
            <p className="text-white/70 text-xs">Recruitment Portal</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mode Toggle */}
            <div className="flex bg-muted rounded-xl p-1 mb-8">
              <button
                onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === "login" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode("signup"); setError(""); setSuccess(""); setSignupStep("form"); }}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === "signup" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Apply Now
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="text-2xl font-display font-bold text-foreground mb-1">Welcome Back</h2>
                  <p className="text-muted-foreground text-sm mb-6">Sign in with your Candidate ID or email</p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="loginId" className="text-sm font-medium">Candidate ID or Email</Label>
                      <div className="relative mt-1.5">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="loginId"
                          placeholder="KG-XXXXXX or email@example.com"
                          value={loginId}
                          onChange={e => setLoginId(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="loginPass" className="text-sm font-medium">Password</Label>
                      <div className="relative mt-1.5">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="loginPass"
                          type={showPass ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginPass}
                          onChange={e => setLoginPass(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2.5 rounded-lg">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Signing in...</span>
                      ) : (
                        <span className="flex items-center gap-2">Sign In <ChevronRight className="h-4 w-4" /></span>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Demo: Use Candidate ID <strong>KG-AZ2024</strong> or email <strong>john.mukasa@example.com</strong>
                        <br />Password: <strong>Test@1234</strong>
                      </p>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AnimatePresence mode="wait">
                    {signupStep === "form" ? (
                      <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-2xl font-display font-bold mb-1">Start Your Application</h2>
                        <p className="text-muted-foreground text-sm mb-6">Join Kyakabi Group — Do More. Be More.</p>

                        <form onSubmit={handleSignup} className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Role Applying For *</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                              <SelectTrigger className="mt-1.5">
                                <Briefcase className="h-4 w-4 text-muted-foreground mr-2" />
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Email Address *</Label>
                            <div className="relative mt-1.5">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="email" placeholder="you@example.com" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} className="pl-10" required />
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Set Password *</Label>
                            <div className="relative mt-1.5">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type={showPass ? "text" : "password"} placeholder="Min. 8 characters" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} className="pl-10 pr-10" required />
                              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Confirm Password *</Label>
                            <div className="relative mt-1.5">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input type="password" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10" required />
                            </div>
                          </div>

                          {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2.5 rounded-lg">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                            </motion.div>
                          )}

                          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                            {loading ? <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Creating Account...</span>
                              : <span className="flex items-center gap-2">Create Account <ChevronRight className="h-4 w-4" /></span>}
                          </Button>
                        </form>
                      </motion.div>
                    ) : (
                      <motion.div key="creds" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-primary" />
                          </div>
                          <h2 className="text-2xl font-display font-bold text-foreground">Account Created! 🎉</h2>
                          <p className="text-muted-foreground text-sm mt-2">Your credentials have been sent to <strong>{signupEmail}</strong></p>
                        </div>

                        <div className="bg-accent/50 border border-primary/20 rounded-xl p-5 mb-6 space-y-3">
                          <h3 className="font-semibold text-sm text-accent-foreground mb-2">Your Login Credentials</h3>
                          <div className="flex items-center justify-between bg-card rounded-lg px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">Candidate ID</span>
                            <span className="font-mono font-bold text-primary">{generatedCreds?.candidateId}</span>
                          </div>
                          <div className="flex items-center justify-between bg-card rounded-lg px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">Email</span>
                            <span className="font-medium text-sm truncate ml-2">{signupEmail}</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-center pt-1">Save these credentials securely</p>
                        </div>

                        <Button onClick={proceedToProfile} className="w-full h-11 font-semibold">
                          Complete My Profile <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-6 text-center text-xs text-muted-foreground border-t">
          © {new Date().getFullYear()} Kyakabi Group Limited · Do More. Be More · a.ddumba@kyakabi.com
        </div>
      </div>
    </div>
  );
}
