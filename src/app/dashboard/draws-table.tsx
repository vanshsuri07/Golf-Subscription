"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake } from "lucide-react";

export function DrawsTable({ recentWins }: { recentWins: any[] }) {
  if (!recentWins || recentWins.length === 0) {
    return (
      <Card className="md:col-span-1 border-dashed">
        <CardHeader>
          <CardTitle>Past Results</CardTitle>
          <CardDescription>Your draw history and winnings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No past draw history to show.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Past Results</CardTitle>
        <CardDescription>Your draw history and winnings.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Draw</TableHead>
              <TableHead>Prize Pool</TableHead>
              <TableHead>Net Credited</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentWins.map((win) => {
              const prizeAmount = win.prize_amount ? Number(win.prize_amount) : 0;
              const netPayout = win.net_payout != null ? Number(win.net_payout) : null;
              const charityDeduction = win.charity_deduction != null ? Number(win.charity_deduction) : null;

              return (
                <TableRow key={win.id}>
                  <TableCell className="font-medium">{win.draw_name || "Legacy Draw"}</TableCell>

                  {/* Prize pool column */}
                  <TableCell>
                    {prizeAmount > 0 ? (
                      <span className="font-semibold">${prizeAmount.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  {/* Net credited column */}
                  <TableCell>
                    {netPayout != null ? (
                      <div className="space-y-0.5">
                        <p className="font-bold text-emerald-500">${netPayout.toFixed(2)}</p>
                        {charityDeduction != null && charityDeduction > 0 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <HeartHandshake className="h-3 w-3 text-rose-400" />
                            −${charityDeduction.toFixed(2)} charity
                          </p>
                        )}
                      </div>
                    ) : win.status === "paid" ? (
                      <span className="text-muted-foreground text-sm">Processing</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant={win.status === "paid" ? "success" : "secondary"}>
                      {(win.status || "pending").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right text-muted-foreground">
                    {win.selected_at ? new Date(win.selected_at).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
