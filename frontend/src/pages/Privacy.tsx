import ScrollReveal from "@/components/ScrollReveal";
import GlassCard from "@/components/GlassCard";

const Privacy = () => (
  <div className="pt-24 pb-16">
    <div className="container mx-auto px-6 max-w-3xl">
      <ScrollReveal>
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
      </ScrollReveal>
      <ScrollReveal>
        <GlassCard className="prose-sm">
          {["Information We Collect", "How We Use Your Information", "Data Storage & Security", "Third-Party Services", "Your Rights", "Cookies", "Contact Us"].map((section) => (
            <div key={section} className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">{section}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. We take your privacy seriously and are committed to protecting your personal data.
              </p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-8">Last updated: February 2026</p>
        </GlassCard>
      </ScrollReveal>
    </div>
  </div>
);

export default Privacy;
