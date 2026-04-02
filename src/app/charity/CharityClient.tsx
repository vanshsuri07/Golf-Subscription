"use client";

import { useTransition, useState } from "react";
import { selectCharity } from "../actions/selectCharity";
import { Heart, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Charity {
  id: string;
  name: string;
  description: string;
}

export default function CharityClient({
  charities,
  initialSelectedId,
}: {
  charities: Charity[];
  initialSelectedId: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (id === selectedId) return; // already selected
    
    startTransition(async () => {
      setError(null);
      const res = await selectCharity(id);
      
      if (res.success) {
        setSelectedId(id);
      } else {
        setError(res.message || "Failed to select charity.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
          <Heart className="w-6 h-6 text-rose-500" />
          Available Causes
        </h2>
        {isPending && <span className="text-sm text-slate-400 animate-pulse">Saving selection...</span>}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charities.map((charity) => {
          const isSelected = selectedId === charity.id;

          return (
            <button
              key={charity.id}
              onClick={() => handleSelect(charity.id)}
              disabled={isPending}
              className={cn(
                "group relative text-left w-full rounded-3xl p-8 transition-all duration-300 ease-out border backdrop-blur-sm",
                isSelected
                  ? "bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/50 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)] scale-[1.02]"
                  : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 border"
              )}
            >
              {isSelected && (
                <div className="absolute top-6 right-6">
                  <CheckCircle2 className="w-6 h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
                </div>
              )}
              
              <h3 className={cn(
                "text-xl font-bold mb-3 transition-colors pr-8",
                isSelected ? "text-indigo-300" : "text-slate-200 group-hover:text-white"
              )}>
                {charity.name}
              </h3>
              
              <p className={cn(
                "leading-relaxed transition-colors",
                isSelected ? "text-indigo-200/80" : "text-slate-400 group-hover:text-slate-300"
              )}>
                {charity.description}
              </p>
              
              <div className="mt-6 flex items-center gap-2 text-sm font-medium">
                {isSelected ? (
                  <span className="text-indigo-400">Currently Supporting</span>
                ) : (
                  <span className="text-slate-500 group-hover:text-indigo-400 transition-colors">Select Cause &rarr;</span>
                )}
              </div>
            </button>
          );
        })}
        {charities.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 text-slate-500 border border-slate-800 border-dashed rounded-3xl">
            No active charities available right now. Let the admins know!
          </div>
        )}
      </div>
    </div>
  );
}
