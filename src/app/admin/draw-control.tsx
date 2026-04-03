"use client";

import { useTransition } from "react";
import { createDraw, runDraw, syncEntries } from "../actions/draw-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function DrawControl({ draws }: { draws: any[] }) {
  const [isPending, startTransition] = useTransition();

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
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <CardTitle>Recent & Active Draws</CardTitle>
          <CardDescription>Execute pending draws to distribute prizes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draws.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="capitalize">{d.mode}</TableCell>
                  <TableCell>
                    {d.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Executed</Badge>}
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
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
                  </TableCell>
                </TableRow>
              ))}
              {draws.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
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
