import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, MessageCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Candidate } from "@/lib/api";
import logoImg from "@/assets/logo.png";

interface SuccessPageProps {
  candidate: Candidate;
  onLogout: () => void;
}

export default function SuccessPage({ candidate, onLogout }: SuccessPageProps) {
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!notified) {
      setNotified(true);
      // Email is sent by backend when profile is submitted
      // We just show success message
    }
  }, []);

  const handleWhatsApp = () => {
    const phone = candidate.profile?.whatsapp || candidate.profile?.phone || '';
    const name = `${candidate.profile?.firstName || ''} ${candidate.profile?.lastName || ''}`.trim();
    const message = `✅ *Application Submitted – Kyakabi Group*\n\nDear ${name},\n\nYour application for *${candidate.role}* has been successfully submitted (ID: ${candidate.candidateId}).\n\n📅 *Next Steps:*\nInterviews will be scheduled before *10th March 2026*.\n\nWe'll contact you shortly with interview details.\n\n*Kyakabi Group Limited* | Do More. Be More\n📧 a.ddumba@kyakabi.com`;
    
    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const name = `${candidate.profile?.firstName || ''} ${candidate.profile?.lastName || ''}`.trim() || 'Candidate';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <img src={logoImg} alt="Kyakabi Group" className="h-16 mx-auto" />
        </motion.div>

        {/* Success Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.7 }}
          className="bg-card rounded-3xl shadow-brand-lg border p-8 text-center"
        >
          {/* Checkmark animation */}
          {/* <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center animate-pulse-green">
              <CheckCircle2 className="h-9 w-9 text-primary-foreground" />
            </div>
          </motion.div> */}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              Congratulations, {name.split(' ')[0]}! 🎉
            </h1>
            <p className="text-lg font-medium text-primary mb-4">Application Successfully Submitted</p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Your application has been received. Interviews will be scheduled before{" "}
              <strong className="text-foreground">10th March 2026</strong>.
            </p>
          </motion.div>

          {/* Info cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 mb-6"
          >
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 text-left">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-mono font-bold text-primary">#</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Candidate ID</p>
                <p className="font-mono font-bold text-foreground">{candidate.candidateId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 text-left">
              <div className="w-9 h-9 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💼</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Applied Role</p>
                <p className="font-semibold text-foreground">{candidate.role}</p> {/* Uncomment this line */}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-accent/50 rounded-xl px-4 py-3 text-left">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Interview Deadline</p>
                <p className="font-semibold text-foreground">Before 10th March 2026</p>
              </div>
            </div>
          </motion.div>

          {/* Next steps */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-left"
          >
            <h3 className="font-semibold text-sm text-primary mb-3">📋 Next Steps</h3>
            <ol className="space-y-2">
              {[
                "Our team will review your application",
                "You'll receive an interview schedule via email",
                "Prepare for a remote interview session",
                "Final decisions communicated within 2 weeks",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            {/* {candidate.profile?.whatsapp && (
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Get WhatsApp Confirmation
              </Button>
            )} */}
            <Button variant="outline" className="w-full" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Exit Portal
            </Button>
          </motion.div>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Questions? Contact us at{" "}
          <a href="mailto:a.ddumba@kyakabi.com" className="text-primary hover:underline">
            a.ddumba@kyakabi.com
          </a>
        </p>
      </div>
    </div>
  );
}