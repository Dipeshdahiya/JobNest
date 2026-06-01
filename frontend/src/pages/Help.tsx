import ScrollReveal from "@/components/ScrollReveal";
import GlassCard from "@/components/GlassCard";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "How do I create an account on JobNest?",
    a: "Creating an account is simple and takes less than a minute. Click on the Sign Up button, choose whether you're a Job Seeker or an Employer, and complete the registration form with your basic details. Once registered, you can immediately start exploring opportunities or posting jobs."
  },
  {
    q: "Is JobNest free to use?",
    a: "Yes. JobNest offers free access to core features for job seekers, including job search, profile creation, AI-based matching, and resume uploads. Employers can start with a free tier and upgrade to premium plans for advanced recruitment tools, analytics, and priority listings."
  },
  {
    q: "How does the AI-powered job matching work?",
    a: "Our AI matching engine analyzes your skills, experience, preferred job roles, and career goals. It continuously learns from user behavior and market trends to recommend opportunities that best align with your professional growth and long-term aspirations."
  },
  {
    q: "Can I upload or update my resume anytime?",
    a: "Absolutely. You can upload your resume in PDF or DOCX format at any time. Our system automatically parses your resume to extract key information and improve your profile visibility. You can update or replace your resume whenever needed."
  },
  {
    q: "How secure is my personal information?",
    a: "We prioritize data security and privacy. JobNest uses encrypted connections, secure authentication methods, and strict data protection policies to ensure your information remains confidential and protected."
  },
  {
    q: "How can employers find the right candidates?",
    a: "Employers can post job openings, filter candidates using advanced search tools, and leverage AI-powered recommendations to identify top talent. Our smart matching system highlights candidates whose skills closely align with job requirements."
  },
  {
    q: "Can I apply to multiple jobs at once?",
    a: "Yes. There is no limit to the number of jobs you can apply for. We encourage candidates to explore multiple opportunities that match their skills and career goals."
  },
  {
    q: "Does JobNest support remote and international jobs?",
    a: "Yes. JobNest supports remote, hybrid, and on-site roles across various regions. Our platform is designed to accommodate the growing global and remote workforce."
  },
  {
    q: "How do I track my job applications?",
    a: "Your dashboard provides a centralized view of all your job applications. You can monitor application status, interview updates, and employer responses directly from your account."
  },
  {
    q: "What makes JobNest different from other job platforms?",
    a: "Unlike traditional job boards, JobNest combines AI-driven matching, skill-based recommendations, professional networking features, and resume enhancement tools into a single ecosystem. Our focus is not just on job listings but on long-term career growth."
  },
  {
    q: "How can I contact customer support?",
    a: "You can reach our support team through the Contact page or by emailing support@jobnest.com. Our team typically responds within 24 hours on business days."
  },
  {
    q: "Will JobNest continue adding new features?",
    a: "Yes. As a growing platform founded in February 2026, we continuously improve and expand our features to meet the evolving needs of professionals and employers in the fast-changing employment landscape."
  }
];

const Help = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="pt-24 pb-16 cursor-default">
      <div className="container mx-auto px-6 max-w-3xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Help Center</p>
            <h1 className="text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
            <p className="text-muted-foreground">Find answers to common questions about JobNest.</p>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <GlassCard className="cursor-pointer" onClick={() => setOpen(open === i ? null : i)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">{faq.q}</h3>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
                </div>
                <div
                  className={`overflow-hidden transition-all duration-[1500ms] ease-in-out ${open === i ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                    }`}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Help;
