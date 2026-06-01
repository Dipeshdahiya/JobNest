import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { authApi } from "@/lib/api/authApi";
import { useAuth } from "@/context/AuthContext";

const VerifyEmail = () => {
  const [token, setToken] = useState("");
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, otp_code: token });
      setSuccess(true);
      setTimeout(() => {
         window.location.href = user?.role === 'employer' ? '/employer/dashboard' : '/seeker/dashboard';
      }, 2000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(', '));
      } else {
        setError("Invalid verification code");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setResendLoading(true);
    setResendMessage("");
    try {
      await authApi.resendOtp({ email });
      setResendMessage("A new code has been sent to your email.");
      setResendCooldown(60);
    } catch (err: any) {
      setResendMessage(err.response?.data?.detail || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard className="glow-sm text-center">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5">
            {success ? <CheckCircle className="w-6 h-6 text-primary-foreground" /> : <Mail className="w-6 h-6 text-primary-foreground" />}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {success ? "Email Verified!" : "Verify Your Email"}
          </h1>
          
          {success ? (
            <p className="text-sm text-muted-foreground mb-6">Redirecting to your dashboard...</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">Enter the 6-digit code sent to your email.</p>
              <form onSubmit={handleSubmit} className="text-left space-y-4">
                {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
                
                {!user && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com" 
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" 
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Verification Code</label>
                  <input 
                    type="text" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors text-center tracking-widest text-lg font-mono" 
                    required
                  />
                </div>

                <Button disabled={loading} type="submit" className="w-full gradient-primary text-primary-foreground border-0 h-12 text-sm font-semibold hover:opacity-90 mt-4">
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              </form>

              <div className="mt-4 space-y-2">
                {resendMessage && (
                  <p className={`text-xs ${resendMessage.includes("Failed") ? "text-red-500" : "text-green-500"}`}>{resendMessage}</p>
                )}
                <button
                  onClick={handleResend}
                  disabled={resendLoading || resendCooldown > 0 || !email}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>

              <div className="mt-4">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default VerifyEmail;
