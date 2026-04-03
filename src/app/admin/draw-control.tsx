"use client";

import { useTransition, useState } from "react";
import { createDraw, runDraw, syncEntries } from "../actions/draw-actions";
import { setPrizePool } from "../actions/prize-pool-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Pencil, Check, X } from "lucide-react";

export function DrawControl({ draws }: { draws: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingPool, setEditingPool] = useState<Record<string, string>>({});
  const [editingDrawId, setEditingDrawId] = useState<string | null>(null);

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await createDraw(formData);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const handleRun = async (drawId: string) => {
    if (!confirm("Are you sure you want to execute this draw? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await runDraw(drawId);
        alert("Draw executed successfully! Winner selected.");
      } catch (err: any) {
        alert("Error executing draw: " + err.message);
      }
    });
  };

  const handleSync = async (drawId: string) => {
    startTransition(async () => {
      try {
        await syncEntries(drawId);
        alert("Entries synchronized successfully.");
      } catch (err: any) {
        alert("Error syncing entries: " + err.message);
      }
    });
  };

  const handleSetPool = async (drawId: string) => {
    const rawVal = editingPool[drawId];
    const amount = parseFloat(rawVal);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid amount (≥ 0).");
      return;
    }
    startTransition(async () => {
      try {
        await setPrizePool(drawId, amount);
        setEditingDrawId(null);
      } catch (err: any) {
        alert("Error updating prize pool: " + err.message);
      }
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Create Draw</CardTitle>
          <CardDescription>Initialize a new prize pool event.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Draw Name</label>
              <input
                id="name"
                name="name"
                required
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Master's Special"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="mode" className="text-sm font-medium">Algorithm</label>
              <select
                id="mode"
                name="mode"
                defaultValue="random"
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="random">Random Standard</option>
                <option value="weighted">Weighted Loyalty</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="prize_amount" className="text-sm font-medium">Initial Prize Pool ($)</label>
              <input
                id="prize_amount"
                name="prize_amount"
                type="number"
                step="0.01"
                min="0"
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="e.g. 500.00"
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Processing..." : "Create Event"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent &amp; Active Draws</CardTitle>
          <CardDescription>Manage prize pools and execute draws.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Prize Pool</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draws.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="capitalize">{d.mode}</TableCell>

                  {/* Prize Pool cell with inline editor */}
                  <TableCell>
                    {d.is_active && !d.pool_locked ? (
                      editingDrawId === d.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            autoFocus
                            defaultValue={d.prize_pool ?? ""}
                            onChange={(e) => setEditingPool((prev) => ({ ...prev, [d.id]: e.target.value }))}
                            className="w-24 h-8 rounded border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="0.00"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-500 hover:text-emerald-400"
                            disabled={isPending}
                            onClick={() => handleSetPool(d.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => setEditingDrawId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          className="flex items-center gap-1.5 group text-sm"
                          onClick={() => {
                            setEditingPool((prev) => ({ ...prev, [d.id]: d.prize_pool?.toString() ?? "0" }));
                            setEditingDrawId(d.id);
                          }}
                        >
                          <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-semibold">
                            {d.prize_pool > 0 ? `$${Number(d.prize_pool).toFixed(2)}` : "Set amount"}
                          </span>
                          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {d.prize_pool > 0 ? `$${Number(d.prize_pool).toFixed(2)}` : "—"}
                        {d.pool_locked && <span className="ml-1 text-xs opacity-60">(locked)</span>}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {d.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Executed</Badge>}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {d.is_active && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleSync(d.id)}
                          >
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={isPending}
                            onClick={() => handleRun(d.id)}
                          >
                            Run Engine
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {draws.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No recent draws found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
