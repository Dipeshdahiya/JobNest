import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { authApi } from "@/lib/api/authApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-auto px-10 py-10 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-6">
      
      <div className="w-full max-w-lg">
        <GlassCard className="p-10 text-center shadow-xl">
          
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-primary-foreground" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Forgot Password?
          </h1>

          {success ? (
            <>
              <p className="text-green-500 mb-8 text-sm">
                Reset link sent to your email successfully!
              </p>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-8 text-sm">
                Enter your registered email and we’ll send you a password reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 text-left">
                
                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground h-12 font-semibold hover:opacity-90"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ForgotPassword;