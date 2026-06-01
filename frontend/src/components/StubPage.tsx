import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface StubPageProps {
  title: string;
  description: string;
  icon?: ReactNode;
  backTo?: string;
}

const StubPage = ({ title, description, backTo }: StubPageProps) => (
  <div className="space-y-6">
    {backTo && (
      <Link to={backTo} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
    )}
    <GlassCard className="text-center py-16">
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">{description}</p>
    </GlassCard>
  </div>
);

export default StubPage;
