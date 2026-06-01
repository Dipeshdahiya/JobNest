import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlassCard from "@/components/GlassCard";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const Signup = () => {
  const [role, setRole] = useState<"seeker" | "employer">("seeker");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const isPersonalEmailDomain = (emailValue: string) => {
    const parts = emailValue.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();
    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "outlook.com",
      "hotmail.com",
      "live.com",
      "msn.com",
      "icloud.com",
      "proton.me",
      "protonmail.com",
      "aol.com",
      "gmx.com",
      "zoho.com",
    ];
    return personalDomains.includes(domain);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const domain = email.split("@")[1]?.toLowerCase() || "";

      // Job seeker: only Gmail allowed
      if (role === "seeker" && domain !== "gmail.com") {
        setError("Job seeker registrations are only allowed with @gmail.com email addresses.");
        setLoading(false);
        return;
      }

      // Employer: enforce company email (non-personal) on the client
      if (role === "employer" && isPersonalEmailDomain(email)) {
        setError(
          "Please use your company email address (e.g. you@yourcompany.com) for employer accounts. Personal domains like Gmail are not allowed."
        );
        setLoading(false);
        return;
      }

      await register({ email, password, role });
      navigate("/verify-email");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      
      <div className="w-full md:w-[85%] h-[85%] grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-xl">
        
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
            Create your account 🚀
          </h1>
          <p className="text-muted-foreground mb-10 text-lg">
            Join JobNest and start your journey today.
          </p>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "seeker" as const, icon: User, label: "Job Seeker", desc: "Find your dream job" },
              { key: "employer" as const, icon: Building2, label: "Employer", desc: "Hire top talent" },
            ].map((r) => (
              <motion.button
                key={r.key}
                onClick={() => setRole(r.key)}
                whileTap={{ scale: 0.97 }}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  role === r.key
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/40"
                }`}
              >
                <r.icon
                  className={`w-6 h-6 mb-3 ${
                    role === r.key ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <p className="font-semibold text-foreground">{r.label}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {r.desc}
                </p>
              </motion.button>
            ))}
          </div>
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
                Create your account
              </h1>
            </div>

            <GlassCard className="p-8">
              <form className="space-y-5" onSubmit={handleSubmit}>
                
                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <Button
                  disabled={loading}
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground h-12 font-semibold hover:opacity-90"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground text-center mt-6">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </GlassCard>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;