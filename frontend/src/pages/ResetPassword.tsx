import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { authApi } from "@/lib/api/authApi";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Typical password reset links look like: /reset-password?token=XYZ
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }
    
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({ token, new_password: password });
      navigate("/login", { state: { message: "Password reset successfully. Please login." } });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard className="glow-sm text-center">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Reset Password</h1>
          
          <p className="text-sm text-muted-foreground mb-6">Enter your new password below.</p>
          <form onSubmit={handleSubmit} className="text-left space-y-4">
            {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">New Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" 
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" 
                required
              />
            </div>

            <Button disabled={loading} type="submit" className="w-full gradient-primary text-primary-foreground border-0 h-12 text-sm font-semibold hover:opacity-90 mt-4 mb-4">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </GlassCard>
      </div>
    </div>
  );
};

export default ResetPassword;
