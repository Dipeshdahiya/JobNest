import ScrollReveal from "@/components/ScrollReveal";
import GlassCard from "@/components/GlassCard";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => (
  <div className="pt-24 pb-16 cursor-default">
    <div className="container mx-auto px-6 max-w-4xl">
      <ScrollReveal>
        <div className="text-center mb-16">
          <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Contact Us</p>
          <h1 className="text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
          <p className="text-muted-foreground">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Mail, label: "Email", value: "simran.dora@jobnest.com" },
          { icon: Phone, label: "Phone", value: "+91 7099504990" },
          { icon: MapPin, label: "Office", value: "Punjab, India" },
        ].map((c) => (
          <ScrollReveal key={c.label}>
            <GlassCard className="text-center cursor-default" hover>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3">
                <c.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">{c.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.value}</p>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>

      <ScrollReveal>
        <GlassCard className="max-w-2xl mx-auto">
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input placeholder="Your Name" className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
              <input type="email" placeholder="Your Email" className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
            </div>
            <input placeholder="Subject" className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
            <textarea rows={5} placeholder="Your message..." className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none" />
            <Button className="w-full gradient-primary text-primary-foreground border-0 h-12 hover:opacity-90">Send Message</Button>
          </form>
        </GlassCard>
      </ScrollReveal>
    </div>
  </div>
);

export default Contact;
