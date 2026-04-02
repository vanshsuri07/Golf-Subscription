"use client";

import { useTransition, useState } from "react";
import { updateWinnerStatus } from "../actions/winner-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function WinnersQueue({ winners }: { winners: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedWinner, setSelectedWinner] = useState<any>(null);

  const handleStatusUpdate = async (id: string, status: string, reason?: string) => {
    startTransition(async () => {
      try {
        await updateWinnerStatus(id, status, reason);
        setSelectedWinner(null);
      } catch (err: any) {
        alert("Error updating status: " + err.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Winner Verification</CardTitle>
        <CardDescription>Review selected winners, verify identity, and trigger payouts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Draw</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Selected</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {winners.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.draw_name}</TableCell>
                <TableCell>
                  <div className="font-medium">{w.full_name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{w.email}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {w.selected_at ? new Date(w.selected_at).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    w.status === 'approved' ? 'success' :
                    w.status === 'rejected' ? 'destructive' :
                    w.status === 'under_review' ? 'secondary' : 'outline'
                  }>
                    {(w.status || "pending").replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={selectedWinner?.id === w.id} onOpenChange={(open) => !open && setSelectedWinner(null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedWinner(w)}>Manage</Button>
                    </DialogTrigger>
                    {selectedWinner?.id === w.id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Winner: {w.full_name}</DialogTitle>
                          <DialogDescription>
                            Transition the payout and verification state. This will be recorded against your admin ID.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-2 py-4">
                          <Button
                            variant="secondary"
                            disabled={isPending || w.status !== 'pending'}
                            onClick={() => handleStatusUpdate(w.id, 'under_review')}
                          >
                            Mark Under Review
                          </Button>
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isPending || !['under_review', 'pending'].includes(w.status)}
                            onClick={() => handleStatusUpdate(w.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={isPending || !['under_review', 'pending'].includes(w.status)}
                            onClick={() => {
                              const reason = prompt("Enter rejection reason:");
                              if (reason) handleStatusUpdate(w.id, 'rejected', reason);
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="default"
                            disabled={isPending || w.status !== 'approved'}
                            onClick={() => handleStatusUpdate(w.id, 'payout_processing')}
                          >
                            Begin Payout Processing
                          </Button>
                          <Button
                            variant="outline"
                            className="border-emerald-500 text-emerald-600"
                            disabled={isPending || w.status !== 'payout_processing'}
                            onClick={() => handleStatusUpdate(w.id, 'paid')}
                          >
                            Mark as Paid
                          </Button>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedWinner(null)}>Cancel</Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {winners.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                  No pending winners to verify.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
