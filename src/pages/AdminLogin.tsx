import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, EyeOff, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import logoImg from "@/assets/logo.png";

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Username is always 'admin' for simplicity
      await api.adminLogin('admin', password);
      onLogin();
    } catch (err: any) {
      setError(err.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border shadow-brand-lg p-8"
        >
          <div className="text-center mb-6">
            <img src={logoImg} alt="Kyakabi" className="h-12 mx-auto mb-4" />
            {/* <div className="w-12 h-12 bg-brand-navy rounded-xl flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-white" />
            </div> */}
            <h1 className="font-display font-bold text-xl">Admin Access</h1>
            <p className="text-muted-foreground text-sm mt-1">Restricted area – authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Admin Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-3 py-2 rounded-lg">
                <AlertCircle className="h-3.5 w-3.5" />{error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Access Admin Panel
            </Button>

            <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={onBack}>
              ← Back to Candidate Portal
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Default password: <strong>Admin@KG2024</strong>
          </p>
        </motion.div>
      </div>
    </div>
  );
}