import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/seeker/jobs", label: "Find Jobs" },
    { to: "/help", label: "Help" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "glass-strong py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">JN</span>
          </div>
          <span className="text-xl font-bold text-foreground">
            Job<span className="text-primary">Nest</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="gradient-primary text-primary-foreground border-0 hover:opacity-90">
              Register
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass-strong mt-2 mx-4 rounded-xl p-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block text-sm text-muted-foreground hover:text-primary py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link to="/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full border-border">Login</Button>
            </Link>
            <Link to="/signup" className="flex-1">
              <Button size="sm" className="w-full gradient-primary text-primary-foreground border-0">Register</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
