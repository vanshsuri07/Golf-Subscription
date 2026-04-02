"use client";

import { reviewWinner } from "@/app/actions/reviewWinner";
import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, DollarSign, Loader2 } from "lucide-react";

type Winner = {
  winner_id: string;
  status: string;
  rejection_reason?: string | null;
  verified_at?: string | null;
  user_id: string;
  user_email: string;
  user_name?: string | null;
  draw_name: string;
  executed_at?: string | null;
  prize_amount: number;
};

export function WinnersTable({ initialWinners }: { initialWinners: Winner[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (winnerId: string, newStatus: "under_review" | "approved" | "rejected" | "payout_processing" | "paid", reason?: string) => {
    setLoadingId(winnerId);
    try {
      await reviewWinner(winnerId, newStatus, reason);
    } catch (e) {
      console.error(e);
      alert("Failed to update status. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-slate-400 capitalize">
            <tr>
              <th className="px-6 py-4 font-medium">Draw</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Prize Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium flex justify-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {initialWinners.map((winner) => (
              <tr key={winner.winner_id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{winner.draw_name}</div>
                  <div className="text-xs text-slate-500">
                    {winner.executed_at ? new Date(winner.executed_at).toLocaleDateString() : 'Unknown date'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{winner.user_name || 'Anonymous User'}</div>
                  <div className="text-xs text-slate-400">{winner.user_email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-emerald-400">
                    ${winner.prize_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    winner.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    winner.status === 'under_review' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    winner.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    winner.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    winner.status === 'payout_processing' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {winner.status.replace('_', ' ')}
                  </span>
                  {winner.status === 'rejected' && winner.rejection_reason && (
                    <div className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {winner.rejection_reason}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 flex justify-end">
                  <div className="flex items-center gap-2">
                    {loadingId === winner.winner_id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                      <>
                        {winner.status === "pending" && (
                          <button onClick={() => handleStatusChange(winner.winner_id, "under_review")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors">
                            Start Review
                          </button>
                        )}
                        {winner.status === "under_review" && (
                          <>
                            <button onClick={() => handleStatusChange(winner.winner_id, "approved")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => {
                              const reason = prompt("Enter rejection reason:");
                              if (reason) handleStatusChange(winner.winner_id, "rejected", reason);
                            }} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {winner.status === "approved" && (
                          <button onClick={() => handleStatusChange(winner.winner_id, "payout_processing")} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors">
                            Process Payout
                          </button>
                        )}
                        {winner.status === "payout_processing" && (
                          <button onClick={() => handleStatusChange(winner.winner_id, "paid")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors">
                            <DollarSign className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {initialWinners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 opacity-50" />
                    <p>No winners found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
