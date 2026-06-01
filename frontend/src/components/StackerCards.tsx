import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2 } from "lucide-react";

const cards = [
  { company: "Google", role: "Senior Frontend Engineer", location: "Mountain View, CA", salary: "$180k - $250k", color: "from-blue-500/20 to-cyan-500/20" },
  { company: "Spotify", role: "Product Designer", location: "Stockholm, Sweden", salary: "$120k - $160k", color: "from-green-500/20 to-emerald-500/20" },
  { company: "Stripe", role: "Full Stack Developer", location: "San Francisco, CA", salary: "$160k - $220k", color: "from-violet-500/20 to-purple-500/20" },
  { company: "Airbnb", role: "Data Scientist", location: "Remote", salary: "$140k - $200k", color: "from-rose-500/20 to-pink-500/20" },
  { company: "Netflix", role: "Backend Engineer", location: "Los Gatos, CA", salary: "$200k - $300k", color: "from-red-500/20 to-orange-500/20" },
];

const StackerCards = () => {
  const [order, setOrder] = useState(cards.map((_, i) => i));

  const shuffle = () => {
    setOrder((prev) => {
      const next = [...prev];
      const top = next.shift()!;
      next.push(top);
      return next;
    });
  };

  return (
    <div
      className="relative w-full h-[320px] cursor-pointer"
      onClick={shuffle}
      title="Click to shuffle"
    >
      {order.slice(0, 4).map((cardIndex, stackPos) => {
        const card = cards[cardIndex];
        const isTop = stackPos === 0;

        return (
          <motion.div
            key={cardIndex}
            animate={{
              scale: 1 - stackPos * 0.05,
              y: stackPos * 18,
              x: stackPos * 8,
              opacity: 1 - stackPos * 0.2,
              zIndex: 10 - stackPos,
              rotateZ: stackPos * -1.5,
            }}
            transition={{
              duration: 0.5,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="absolute inset-0"
          >
            <div
              className={`glass rounded-2xl p-6 h-full border border-border/50 bg-gradient-to-br ${card.color} ${
                isTop ? "shadow-xl shadow-primary/5" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Featured
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">{card.role}</h3>
              <p className="text-sm text-muted-foreground mb-4">{card.company}</p>

              <div className="flex flex-col gap-2 mt-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {card.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Briefcase className="w-3.5 h-3.5" />
                  {card.salary}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2.5 py-1 rounded-full">Full-time</span>
                <span className="text-[10px] bg-secondary/50 text-muted-foreground px-2.5 py-1 rounded-full">Remote OK</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StackerCards;
