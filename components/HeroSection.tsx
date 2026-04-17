'use client';

import { motion } from "framer-motion";
import { Sparkles, Shield, AlertOctagon, BarChart3 } from "lucide-react";

const features = [
  { icon: Shield, title: "Coverage Analysis", desc: "Limits, deductibles & covered perils" },
  { icon: AlertOctagon, title: "Exclusion Alerts", desc: "Hidden gaps that could cost you" },
  { icon: BarChart3, title: "Risk Scoring", desc: "Overall policy grade at a glance" },
];

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-left"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-1.5">
        <Sparkles className="w-3 h-3" />
        AI-Powered Insurance Analysis
      </div>

      <h1 className="text-2xl md:text-3xl lg:text-4xl tracking-tight leading-tight font-[family-name:var(--font-serif)]">
        Understand your policy{" "}
        <em className="text-gradient not-italic">in 60 seconds</em>
      </h1>

      <p className="mt-1 text-muted-foreground text-xs md:text-sm max-w-md leading-relaxed">
        Upload your insurance policy PDF and get instant AI-powered analysis of coverage, exclusions, and risky clauses.
      </p>

      {/* Feature list */}
      <div className="mt-2 space-y-1">
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <feat.icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground leading-tight">{feat.title}</p>
              <p className="text-[11px] text-muted-foreground">{feat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
