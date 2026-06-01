import ScrollReveal from "@/components/ScrollReveal";
import GlassCard from "@/components/GlassCard";
import { Users, Target, Globe, Award } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";

const About = () => (
  <div className="pt-24 pb-16 cursor-default">
    <div className="container mx-auto px-6">
      <ScrollReveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">About JobNest</p>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Empowering Dreams, Crafting Futures</h1>
          <p className="text-muted-foreground leading-relaxed">We're on a mission to connect talented professionals with amazing opportunities worldwide.</p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { icon: Users, label: "Active Users", value: 100000 },
          { icon: Target, label: "Jobs Posted", value: 15000 },
          { icon: Globe, label: "Countries", value: 50 },
          { icon: Award, label: "Success Stories", value: 8000 },
        ].map((s, i) => (
          <ScrollReveal key={s.label} delay={i * 0.1}>
            <GlassCard className="text-center cursor-default" hover>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <s.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <AnimatedCounter end={s.value} className="text-2xl font-bold text-foreground" />
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal>
        <GlassCard className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">Founded in February 2026 by Simran Dora, JobNest was created to transform how talent connects with opportunity in a rapidly evolving digital world. Recognizing the limitations of traditional job boards, Simran envisioned a platform that combines intelligence, transparency, and human-centered design to make hiring smarter and more meaningful.</p>
          <p className="text-muted-foreground leading-relaxed mb-4">As industries shift toward AI-powered recruitment, remote-first work cultures, and skills-based evaluation, the global employment landscape is entering a new phase. JobNest was built to lead in this growing field — not just by listing jobs, but by creating an ecosystem where careers are strategically shaped.</p>
          <p className="text-muted-foreground leading-relaxed mb-4">Under Simran Dora’s leadership, JobNest focuses on intelligent job matching, personalized skill recommendations, resume optimization tools, and networking features that empower professionals at every stage of their journey.</p>
          <p className="text-muted-foreground leading-relaxed">What started in 2026 as a bold idea is rapidly evolving into a future-ready career platform designed for modern professionals and forward-thinking companies. Our mission is simple yet ambitious: build the infrastructure for the next generation of work — where technology amplifies potential and opportunity knows no limits.</p>
        </GlassCard>
      </ScrollReveal>
    </div>
  </div>
);

export default About;
