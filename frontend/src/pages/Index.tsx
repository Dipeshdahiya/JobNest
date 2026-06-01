import { useState } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Briefcase, FileText, BrainCircuit, Users, ArrowRight, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";
import GlassCard from "@/components/GlassCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import heroGlobe from "@/assets/hero-globe.png";
import StackerCards from "@/components/StackerCards";




const categories = [
  { name: "IT & Software", count: 1250, salary: "$5 - $6000/Month" },
  { name: "Design & Creative", count: 850, salary: "$4 - $5000/Month" },
  { name: "Sales & Marketing", count: 620, salary: "$3 - $4000/Month" },
  { name: "Writing & Translation", count: 430, salary: "$2 - $3000/Month" },
  { name: "Finance & Accounting", count: 320, salary: "$4 - $5500/Month" },
  { name: "Admin & Customer Support", count: 280, salary: "$2 - $3500/Month" },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Product Designer",
    company: "Google",
    content: "JobNest completely transformed my job search. The AI matching is incredibly accurate, and I found my dream role within two weeks of signing up.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Senior Developer",
    company: "Stripe",
    content: "The quality of opportunities here is unmatched. The interface is clean, and the application process is smoother than any other platform I've used.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Director",
    company: "Netflix",
    content: "As a hiring manager, the candidate quality we get from JobNest is exceptional. It's our go-to platform for building our team.",
    rating: 5,
  },
];

const companies = [
  // 🌍 Global Tech Giants
  { name: "Google" },
  { name: "Microsoft" },
  { name: "Apple" },
  { name: "Amazon" },
  { name: "Meta" },
  { name: "Netflix" },
  { name: "Tesla" },
  { name: "Nvidia" },
  { name: "Intel" },
  { name: "AMD" },
  { name: "Samsung" },
  { name: "Sony" },
  { name: "IBM" },
  { name: "Oracle" },
  { name: "Adobe" },
  { name: "Salesforce" },
  { name: "SAP" },
  { name: "Cisco" },
  { name: "Uber" },
  { name: "Airbnb" },

  // 💳 Fintech
  { name: "Stripe" },
  { name: "PayPal" },
  { name: "Square" },
  { name: "Visa" },
  { name: "Mastercard" },
  { name: "Razorpay" },
  { name: "PhonePe" },
  { name: "Paytm" },

  // 🚀 Startups & Unicorns
  { name: "OpenAI" },
  { name: "Notion" },
  { name: "Figma" },
  { name: "Canva" },
  { name: "Zoom" },
  { name: "Slack" },
  { name: "Discord" },
  { name: "Databricks" },
  { name: "Snowflake" },
  { name: "Coinbase" },
  { name: "Robinhood" },

  // 🇮🇳 Indian IT & Pvt Ltd
  { name: "TCS Pvt Ltd" },
  { name: "Infosys Pvt Ltd" },
  { name: "Wipro Pvt Ltd" },
  { name: "HCL Technologies Pvt Ltd" },
  { name: "Tech Mahindra Pvt Ltd" },
  { name: "Zoho Corporation Pvt Ltd" },
  { name: "Freshworks Pvt Ltd" },
  { name: "Flipkart Pvt Ltd" },
  { name: "Zomato Pvt Ltd" },
  { name: "Swiggy Pvt Ltd" },
  { name: "Byju's Pvt Ltd" },
  { name: "Ola Cabs Pvt Ltd" },
  { name: "Delhivery Pvt Ltd" },
  { name: "CRED Pvt Ltd" },

  // 🌐 SaaS Companies
  { name: "Atlassian" },
  { name: "HubSpot" },
  { name: "Shopify" },
  { name: "Dropbox" },
  { name: "Asana" },
  { name: "Monday.com" },
  { name: "GitHub" },
  { name: "GitLab" },

  // 🏢 Enterprise & Consulting
  { name: "Accenture Pvt Ltd" },
  { name: "Capgemini Pvt Ltd" },
  { name: "Deloitte Pvt Ltd" },
  { name: "PwC Pvt Ltd" },
  { name: "KPMG Pvt Ltd" },
  { name: "EY Pvt Ltd" },

  // 🌱 Fast Growing Startups
  { name: "BrowserStack Pvt Ltd" },
  { name: "Postman Pvt Ltd" },
  { name: "Meesho Pvt Ltd" },
  { name: "Udaan Pvt Ltd" },
  { name: "Unacademy Pvt Ltd" },
  { name: "Lenskart Pvt Ltd" },
  { name: "Nykaa Pvt Ltd" },
  { name: "Dream11 Pvt Ltd" }
];

const categoryTabs: Record<string, { name: string; count: number; salary: string }[]> = {
  "Near You": categories,
  "Top Skills": [
    { name: "React & Frontend", count: 820, salary: "$8 - $4000/Month" },
    { name: "Python & Data Science", count: 650, salary: "$10 - $5000/Month" },
    { name: "Cloud & DevOps", count: 430, salary: "$12 - $6000/Month" },
    { name: "Mobile Development", count: 310, salary: "$7 - $3500/Month" },
    { name: "AI & Machine Learning", count: 290, salary: "$15 - $7000/Month" },
    { name: "Cybersecurity", count: 180, salary: "$10 - $5500/Month" },
  ],
  "Trending Skills": [
    { name: "Generative AI", count: 1200, salary: "$12 - $8000/Month" },
    { name: "Prompt Engineering", count: 950, salary: "$8 - $5000/Month" },
    { name: "Rust Development", count: 340, salary: "$10 - $6000/Month" },
    { name: "Web3 & Blockchain", count: 270, salary: "$9 - $5500/Month" },
    { name: "AR / VR Design", count: 190, salary: "$7 - $4500/Month" },
    { name: "Edge Computing", count: 150, salary: "$11 - $6000/Month" },
  ],
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("Near You");

  const [floatingCompanies, setFloatingCompanies] = useState<
    { name: string; id: string; top: number; right: number }[]
  >([]);


  useEffect(() => {
    const pickRandomCompanies = () => {
      const count = Math.floor(Math.random() * 4) + 2;

      const shuffled = [...companies]
        .sort(() => 0.5 - Math.random())
        .slice(0, count)
        .map((c) => ({
          name: c.name,
          id: Math.random().toString(36).substring(7),

          // Constrain vertically (globe center area)
          top: 20 + Math.random() * 50,

          // Constrain horizontally (only right 50% area)
          right: 5 + Math.random() * 35,
        }));

      setFloatingCompanies(shuffled);
    };

    pickRandomCompanies();
    const interval = setInterval(pickRandomCompanies, 4500);

    return () => clearInterval(interval);
  }, []);



  return (
    <div className="overflow-hidden cursor-default">
      {/* Hero */}
      <section className="relative min-h-screen flex  items-center pt-20">
        <div className="absolute  inset-0">
          <img src={heroGlobe} alt="" className="absolute  right-0 top-1/2 -translate-y-1/2 w-[60%] opacity-40 pointer-events-none" />

        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <motion.span
              className="inline-block text-primary text-sm font-semibold tracking-widest uppercase mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Best Job Seekers Platform
            </motion.span>

            <motion.h1
              className="text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Find A Job That{" "}
              <span className="text-gradient">Works For You</span>
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground mb-8 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Uncover positions that not only match your qualifications but also provide avenues for continuous growth and career progression.
            </motion.p>

            <motion.div
              className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 px-4 py-3 flex-1">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <input placeholder="Job Title" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 flex-1 border-l border-border">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <input placeholder="Location" className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
              </div>
              <Link to="/seeker/jobs">
                <Button className="gradient-primary text-primary-foreground border-0 px-6 h-11 hover:opacity-90">
                  <Search className="w-4 h-4 mr-2" /> Search
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="flex items-center gap-2 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">4.7/5 on Trustpilot · <strong className="text-foreground">Read Reviews</strong></span>
            </motion.div>
          </div>
        </div>

        {/* Floating company badges */}
        <AnimatePresence>
          {floatingCompanies.map((company) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 1.2 }}
              className="hidden lg:flex absolute glass rounded-xl px-4 py-3 items-center gap-3"
              style={{
                top: `${company.top}%`,
                right: `${company.right}%`,
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {company.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {company.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(Math.random() * 20) + 5} Job opportunities
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      

      {/* Categories */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <p className="text-primary text-sm font-semibold text-center uppercase tracking-widest mb-3">Category</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              Find Skills That Suit Your Interests
            </h2>
          </ScrollReveal>

          <div className="flex justify-center gap-6 mb-10 mt-8">
            {Object.keys(categoryTabs).map((t) => (

              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`text-sm font-medium transition-colors ${activeTab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>

            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTabs[activeTab].map((cat, i) => (
              <Link to={`/signup`}>
                <ScrollReveal key={cat.name} delay={i * 0.1}>
                  <GlassCard hover className="flex items-center justify-between">

                    <div>
                      <h3 className="font-semibold text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Briefcase className="w-3 h-3 inline mr-1" />
                        {cat.count} Jobs · {cat.salary}
                      </p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </GlassCard>
                </ScrollReveal>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">More About JobNest</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Empowering Dreams, Crafting Futures Together
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Realizing dreams and shaping a better future through cooperation and mutual support. Our platform connects talented professionals with industry-leading companies.
              </p>
              <div className="flex gap-12">
                <div>
                  <AnimatedCounter end={100000} className="text-3xl font-bold text-foreground" />
                  <p className="text-sm text-muted-foreground mt-1">Users</p>
                </div>
                <div>
                  <AnimatedCounter end={15000} className="text-3xl font-bold text-foreground" />
                  <p className="text-sm text-muted-foreground mt-1">Job Vacancy</p>
                </div>
                <div>
                  <span className="text-3xl font-bold text-foreground">5+</span>
                  <p className="text-sm text-muted-foreground mt-1">Years</p>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <StackerCards />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Company logos */}
      <section className="py-24 border-y border-border">
        <div className="container mx-auto px-6">

          {/* Heading */}
          <p className="text-primary text-sm font-semibold text-center uppercase tracking-widest mb-4">Connection</p>
          <p className="text-3xl md:text-4xl font-bold text-foreground text-center mb-14">
            TRUSTED BY LEADING COMPANIES
          </p>

          {/* Marquee */}
          <div className="w-full overflow-hidden space-y-10">

            {/* ROW 1 — Right to Left */}
            <div className="overflow-hidden">
              <div className="flex gap-20 w-max marquee-left">
                {[...companies, ...companies].map((c, i) => (
                  <div
                    key={`row1-${i}`}
                    className="text-2xl font-semibold text-foreground/60 hover:text-primary transition-colors duration-300 whitespace-nowrap"
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 2 — Left to Right */}
            <div className="overflow-hidden">
              <div className="flex gap-20 w-max marquee-right">
                {[...companies, ...companies].map((c, i) => (
                  <div
                    key={`row2-${i}`}
                    className="text-2xl font-semibold text-foreground/60 hover:text-primary transition-colors duration-300 whitespace-nowrap"
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

            {/* ROW 3 — Right to Left (Slower) */}
            <div className="overflow-hidden">
              <div className="flex gap-20 w-max marquee-left marquee-slow">
                {[...companies, ...companies].map((c, i) => (
                  <div
                    key={`row3-${i}`}
                    className="text-2xl font-semibold text-foreground/60 hover:text-primary transition-colors duration-300 whitespace-nowrap"
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <p className="text-primary text-sm font-semibold text-center uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              Easy To Use, Easy To Apply
            </h2>
            <p className="text-muted-foreground text-center max-w-lg mx-auto mb-16">
              Find your dream job easily and quickly. Our platform is designed for your convenience.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Sign Up for JobNest", desc: "Create your account and complete your profile to get started." },
              { icon: Search, title: "Discover Opportunities", desc: "Explore thousands of diverse job vacancies across industries." },
              { icon: CheckCircle, title: "Apply And Thrive", desc: "Turn your career dreams into reality. Apply now for exciting opportunities." },
            ].map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.15}>
                <GlassCard hover className="text-center cursor-default">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-5 glow-sm">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollReveal>
              <GlassCard className="p-8 glow-sm">
                <div className="space-y-4">
                  {[
                    { icon: Search, title: "Smart Job Matching", desc: "AI-powered matching connects you with the perfect roles." },
                    { icon: FileText, title: "Resume Builder", desc: "Create professional resumes tailored for each application." },
                    { icon: BrainCircuit, title: "AI Insights", desc: "Get personalized career advice and skill gap analysis." },
                    { icon: Users, title: "Professional Network", desc: "Connect with industry leaders and grow your network." },
                  ].map((f) => (
                    <div key={f.title} className="flex gap-4 p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <f.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{f.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Why JobNest</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why JobNest Is The Top Choice For Job Seekers
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Realizing dreams and shaping a better future through cooperation and mutual support.
              </p>
              <Link to="/signup">
                <Button className="gradient-primary text-primary-foreground border-0 hover:opacity-90">
                  Learn More <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-4">
              What Our Users Say About JobNest
            </h2>
            <p className="text-muted-foreground text-center max-w-lg mx-auto mb-16">
              See how JobNest has transformed careers and hiring experiences worldwide.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 0.1}>
                <GlassCard hover className="cursor-default">
                  <div className="flex mb-3">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {t.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role} at {t.company}</p>
                    </div>
                  </div>
                </GlassCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <ScrollReveal>
            <div className="gradient-primary rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/5 to-transparent" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Work With The Skill You Have!
                </h2>
                <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
                  Whether you're starting your career or looking for a change, we'll help you find the perfect match.
                </p>
                <Link to="/signup">
                  <Button size="lg" variant="outline" className="bg-background text-foreground border-0 hover:bg-background/90 font-semibold">
                    Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Index;
