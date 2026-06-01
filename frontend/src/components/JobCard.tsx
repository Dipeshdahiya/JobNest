import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Bookmark, BookmarkCheck, Users } from "lucide-react";
import GlassCard from "./GlassCard";
import { Badge } from "@/components/ui/badge";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: string;
  salary: string;
  remote: boolean;
  posted: string;
  skills: string[];
  applicants: number;
  saved: boolean;
  onToggleSave?: () => void;
}

const JobCard = ({ id, title, company, companyLogo, location, type, salary, remote, posted, skills, applicants, saved, onToggleSave }: JobCardProps) => {
  const navigate = useNavigate();

  return (
    <GlassCard hover className="group" onClick={() => navigate(`/seeker/jobs/${id}`)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            {companyLogo}
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{company}</p>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); onToggleSave?.(); }}>
          {saved ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" /> {location}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" /> {posted}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" /> {applicants} applicants
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills.slice(0, 3).map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs bg-secondary/50 text-muted-foreground border-0">
            {skill}
          </Badge>
        ))}
        {skills.length > 3 && (
          <Badge variant="secondary" className="text-xs bg-secondary/50 text-muted-foreground border-0">
            +{skills.length - 3}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{salary}</span>
        <div className="flex gap-2">
          {remote && (
            <Badge className="gradient-primary text-primary-foreground text-xs border-0">Remote</Badge>
          )}
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">{type}</Badge>
        </div>
      </div>
    </GlassCard>
  );
};

export default JobCard;
