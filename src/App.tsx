import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthPage from "./pages/AuthPage";
import ProfileSetup from "./pages/ProfileSetup";
import SuccessPage from "./pages/SuccessPage";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import { type Candidate } from "./lib/api";

const queryClient = new QueryClient();

type AppView = "auth" | "profile" | "success" | "admin" | "admin-login";

export default function App() {
  const [view, setView] = useState<AppView>("auth");
  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    // Check URL for admin
    if (window.location.hash === "#admin") {
      setView("admin-login");
    }
  }, []);

  const handleCandidateLogin = (cand: Candidate) => {
    setCandidate(cand);
    if (cand.submitted) {
      setView("success");
    } else {
      setView("profile");
    }
  };

  const handleProfileComplete = (cand: Candidate) => {
    setCandidate(cand);
    setView("success");
  };

  const handleLogout = () => {
    setCandidate(null);
    setView("auth");
    window.location.hash = "";
  };

  // Secret admin access: type ?admin in URL
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        setView("admin-login");
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {view === "auth" && (
          <AuthPage onLogin={handleCandidateLogin} />
        )}
        {view === "profile" && candidate && (
          <ProfileSetup candidate={candidate} onComplete={handleProfileComplete} />
        )}
        {view === "success" && candidate && (
          <SuccessPage candidate={candidate} onLogout={handleLogout} />
        )}
        {view === "admin-login" && (
          <AdminLogin onLogin={() => setView("admin")} onBack={() => setView("auth")} />
        )}
        {view === "admin" && (
          <AdminPanel onLogout={handleLogout} />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}