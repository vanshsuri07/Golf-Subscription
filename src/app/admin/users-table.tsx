"use client";

import { useTransition } from "react";
import { updateUserRole } from "../actions/admin-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
        <CardDescription>Manage subscriber accounts and administrator access.</CardDescription>
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
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
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
