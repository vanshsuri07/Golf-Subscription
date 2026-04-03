"use client";

import { useTransition, useState } from "react";
import { updateUserRole } from "../actions/admin-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function UsersTable({ users }: { users: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "subscriber" : "admin";
    if (confirm(`Are you sure you want to change this user to ${newRole}?`)) {
      startTransition(async () => {
        try {
          await updateUserRole(userId, newRole);
        } catch (err: any) {
          alert("Error: " + err.message);
        }
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage subscriber accounts, administrator access, and verify scores.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.full_name || "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === "admin" ? "destructive" : "default"}>
                    {u.role || "subscriber"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.sub_status === "active" ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">None</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right flex items-center justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        View Scores
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{u.full_name}'s Scores</DialogTitle>
                        <DialogDescription>
                          Recent rolling scores used for draw eligibility.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        {u.scores && u.scores.length > 0 ? (
                          <div className="flex gap-2 justify-center">
                            {u.scores.map((score: any, idx: number) => (
                              <div key={idx} className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-bold dark:bg-emerald-950 dark:text-emerald-400">
                                {score}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground my-4">No scores submitted yet.</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => handleRoleToggle(u.id, u.role)}
                  >
                    {u.role === "admin" ? "Remove Admin" : "Make Admin"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
