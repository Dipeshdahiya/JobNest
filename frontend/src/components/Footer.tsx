import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card/50">
    <div className="container mx-auto px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">JN</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Job<span className="text-primary">Nest</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your premium career platform. Find jobs, build your resume, and connect with professionals worldwide.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-all">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-all">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary/80 transition-all">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
        {[
          {
            title: "Platform",
            links: [
              { to: "/seeker/jobs", label: "Browse Jobs" },
              { to: "/seeker/dashboard", label: "Dashboard" },
              { to: "/seeker/social", label: "Social Feed" },
              { to: "/about", label: "About Us" },
            ],
          },
          {
            title: "Resources",
            links: [
              { to: "/help", label: "Help Center" },
              { to: "/contact", label: "Contact Us" },
              { to: "/terms", label: "Terms of Service" },
              { to: "/privacy", label: "Privacy Policy" },
            ],
          },
          {
            title: "For Employers",
            links: [
              { to: "/employer/dashboard", label: "Employer Dashboard" },
              { to: "/employer/post-job", label: "Post a Job" },
              { to: "/employer/manage-jobs", label: "Manage Jobs" },
              { to: "/employer/company-profile", label: "Company Profile" },
            ],
          },
        ].map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-12 pt-8 text-center">
        <p className="text-sm text-muted-foreground">© 2026 JobNest. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
