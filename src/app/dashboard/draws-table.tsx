"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
              <TableHead>Prize</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentWins.map((win) => (
              <TableRow key={win.id}>
                <TableCell className="font-medium">{win.draw_name || "Legacy Draw"}</TableCell>
                <TableCell className="font-semibold text-emerald-600">
                  ${win.prize_amount ? Number(win.prize_amount).toFixed(2) : "0.00"}
                </TableCell>
                <TableCell>
                  <Badge variant={win.status === "paid" ? "success" : "secondary"}>
                    {(win.status || "pending").replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {win.selected_at ? new Date(win.selected_at).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
