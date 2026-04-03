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
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className={`flex items-center gap-3 mb-6 ${headerBgColor} p-3 rounded-xl`}>
        <span className="text-xl">{icon}</span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className={`border-l-4 ${borderColor} pl-4 py-2 bg-gray-50 rounded px-4`}
            >
              <p className="text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
