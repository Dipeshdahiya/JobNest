import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const domain = email.split("@")[1]?.toLowerCase() || "";

      // Client-side email rules to match backend
      if (role === "seeker" && domain !== "gmail.com") {
        setError("Job seeker login is only allowed with @gmail.com email addresses.");
        setLoading(false);
        return;
      }
      const personalDomains = [
        "gmail.com","yahoo.com","outlook.com","hotmail.com","live.com",
        "msn.com","icloud.com","proton.me","protonmail.com","aol.com",
        "gmx.com","zoho.com",
      ];
      if (role === "employer" && personalDomains.includes(domain)) {
        setError("Employer login requires a company email (not a personal provider like Gmail).");
        setLoading(false);
        return;
      }

      const user = await login({ username: email, password });

      // Redirect based on actual user.role from server
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "employer") {
        navigate("/employer/dashboard");
      } else {
        navigate("/seeker/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      
      <div className="w-full md:w-[85%] h-[85%] rounded-2xl overflow-hidden grid md:grid-cols-2 shadow-xl">
        
        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center px-16 bg-gradient-to-br from-primary/10 via-background to-background">
          
          <Link to="/" className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">JN</span>
            </div>
            <span className="text-4xl font-bold text-foreground">
              Job<span className="text-primary">Nest</span>
            </span>
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome Back 👋
          </h1>

          <p className="text-muted-foreground text-lg max-w-md">
            Sign in to access opportunities and manage your job journey with ease and confidence.
          </p>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-8">
          <div className="w-full max-w-lg">

            {/* Mobile Header */}
            <div className="text-center mb-8 md:hidden">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold">JN</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  Job<span className="text-primary">Nest</span>
                </span>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome Back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your account
              </p>
            </div>

            <GlassCard className="p-8">
              <form className="space-y-5" onSubmit={handleSubmit}>
                
                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Role toggle */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setRole("seeker")}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                      role === "seeker"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/60"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Job Seeker
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("employer")}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                      role === "employer"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/60"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Employer
                  </button>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary"
                      required
                    />
                    <Eye className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer" />
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="rounded border-border" />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground h-12 font-semibold hover:opacity-90"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-6">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </GlassCard>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;