"use client";

import { useActionState, useEffect } from "react";
import { submitScore } from "../actions/submitScore";

type ActionState = { message?: string; success: boolean } | null;

export function ScoreForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const parsedScore = parseInt(formData.get("score") as string, 10);
      return await submitScore(parsedScore);
    },
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 mt-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="score" className="text-sm font-medium text-slate-300">
          Enter Your Score
        </label>
        <input
          id="score"
          name="score"
          type="number"
          min="0"
          max="150"
          required
          className="bg-slate-800 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-amber-500 transition-colors"
          placeholder="e.g. 72"
        />
      </div>

      {state && (
        <div className={`text-sm ${state.success ? 'text-emerald-400' : 'text-red-400'}`}>
          {state.message || (state.success ? "Score submitted successfully!" : "Failed to submit score.")}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? "Submitting..." : "Submit Score"}
      </button>
    </form>
  );
}
