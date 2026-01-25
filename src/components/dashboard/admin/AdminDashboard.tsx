"use client";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
  const organizations = useQuery(api.organizations.list);
  const [selectedOrg, setSelectedOrg] = useState<Id<"organizations"> | null>(
    null,
  );
  const users = useQuery(
    api.users.byOrganization,
    selectedOrg ? { organizationId: selectedOrg } : "skip",
  );
  const removeUser = useMutation(api.users.removeUserFromOrganization);
  const addUser = useMutation(api.users.addUserToOrganization);

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<
    "admin" | "superAdmin" | "user"
  >("user");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  const handleOrgSelect = (orgId: string) => {
    setSelectedOrg(orgId as Id<"organizations">);
  };

  const handleRemoveUser = async (
    userConfigId: Id<"userConfig">,
    organizationId: Id<"organizations">,
  ) => {
    try {
      await removeUser({ userConfigId, organizationId });
      toast.success("User removed from organization");
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  const handleSaveUser = async () => {
    if (!selectedOrg || !newUserEmail) {
      toast.error("Please select an organization and enter an email.");
      return;
    }

    try {
      await addUser({
        email: newUserEmail,
        organizationId: selectedOrg,
        role: newUserRole,
      });
      toast.success("User added successfully");
      setNewUserEmail("");
      setNewUserRole("user");
      setIsAddUserDialogOpen(false);
    } catch (error) {
      toast.error("Failed to add user");
    }
  };

  return (
    <div className="">
      <h1 className="text-3xl font-bold mb-6 border-b p-4">
        Panel de administrador
      </h1>
      <section className="mb-4 lg:px-8 px-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">
            Selecciona una organización
          </h2>
          <Select onValueChange={handleOrgSelect}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations?.map((org) => (
                <SelectItem key={org._id} value={org._id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedOrg && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {" "}
                Miembros de la organización
              </h2>
              <Dialog
                open={isAddUserDialogOpen}
                onOpenChange={setIsAddUserDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>Añadir usuario</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Añadir nuevo usuario</DialogTitle>
                    <DialogDescription>
                      Añade un nuevo usuario a la organización.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Rol
                      </Label>
                      <Select
                        onValueChange={(
                          value: "admin" | "superAdmin" | "user",
                        ) => setNewUserRole(value)}
                        defaultValue={newUserRole}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superAdmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddUserDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveUser}>Guardar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user?.userConfigId}>
                    <TableCell>{user?.name || "N/A"}</TableCell>
                    <TableCell>{user?.email}</TableCell>
                    <TableCell>{user?.role}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleRemoveUser(
                            user?.userConfigId as Id<"userConfig">,
                            selectedOrg,
                          )
                        }
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
