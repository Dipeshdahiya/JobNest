import ScrollReveal from "@/components/ScrollReveal";
import GlassCard from "@/components/GlassCard";

const Terms = () => (
  <div className="pt-24 pb-16">
    <div className="container mx-auto px-6 max-w-3xl">
      <ScrollReveal>
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
      </ScrollReveal>
      <ScrollReveal>
        <GlassCard className="prose-sm">
          {["Acceptance of Terms", "User Accounts", "Job Listings", "Intellectual Property", "Privacy", "Limitation of Liability", "Changes to Terms"].map((section) => (
            <div key={section} className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">{section}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-8">Last updated: February 2026</p>
        </GlassCard>
      </ScrollReveal>
    </div>
  </div>
);

export default Terms;
