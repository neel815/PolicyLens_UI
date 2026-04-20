"use client";

import { ReactNode } from "react";

interface ResultSectionProps {
  title: string;
  icon: ReactNode;
  items: string[];
  emptyMessage: string;
  borderColor: string;
  headerBgColor: string;
}

export default function ResultSection({
  title,
  icon,
  items,
  emptyMessage,
  borderColor,
  headerBgColor,
}: ResultSectionProps) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.2)] overflow-hidden">
      <div className={`flex items-center gap-3 ${headerBgColor} border-b border-border p-4 px-5`}>
        <span className="text-lg flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {items.length > 0 && (
          <span className="ml-auto text-[11px] font-medium text-white bg-white/20 rounded-full px-2 py-1">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">{emptyMessage}</p>
      ) : (
        <div className="p-4 space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${borderColor} border-l-4 pl-3 py-2 text-[13px] text-foreground`}
            >
              <span className="flex-shrink-0">•</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
