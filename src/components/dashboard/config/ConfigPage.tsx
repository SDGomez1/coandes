"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";

const updateNameSchema = z.object({
  name: z.string().min(2, "El nombre tiene que tener al menos 2 letras"),
});

const addUserSchema = z.object({
  email: z.string().email({ message: "Pon un correo valido" }),
  role: z.enum(["admin", "user"]),
});

import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { Id as authId } from "../../../../convex/betterAuth/_generated/dataModel";
import { Id } from "../../../../convex/_generated/dataModel";

type User = {
  userConfigId: Id<"userConfig">;
  userId: authId<"user">;
  name: string;
  email: string;
  role: string;
};

export function ConfigPage({ userData }: { userData: any }) {
  const org = useQuery(api.organizations.getOrg);
  const config = useQuery(api.userConfig.getCurrentUserConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const organizationUsers = useQuery(api.users.byOrganization, {
    organizationId: org?._id as Id<"organizations">,
  });

  const updateUserName = useMutation(api.users.updateUserConfig);
  const addUserToOrganization = useMutation(api.users.addUserToOrganization);
  const removeUserFromOrganization = useMutation(
    api.users.removeUserFromOrganization,
  );

  const updateNameForm = useForm<z.infer<typeof updateNameSchema>>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: userData.name || "" },
  });

  const addUserForm = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { email: "", role: "user" },
  });

  const handleUpdateName = (values: z.infer<typeof updateNameSchema>) => {
    updateUserName({ userId: userData.userId, name: values.name })
      .then(() => {
        toast.success("Nombre actualizado correctamente");
        setIsEditing(false);
      })
      .catch(() => {
        toast.error("Error al actualizar el nombre");
      });
  };

  const handleAddUser = (values: z.infer<typeof addUserSchema>) => {
    addUserToOrganization({
      email: values.email,
      organizationId: org?._id as Id<"organizations">,
      role: values.role,
    })
      .then(() => {
        toast.success("Usuario agregado correctamente");
        addUserForm.reset();
      })
      .catch(() => {
        toast.error("Error al agregar usuario");
      });
  };

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    removeUserFromOrganization({
      userConfigId: userToDelete.userConfigId,
      organizationId: userData.organizationId,
    })
      .then(() => {
        toast.success("Usuario eliminado correctamente");
        setIsConfirmOpen(false);
        setUserToDelete(null);
      })
      .catch(() => {
        toast.error("Error al eliminar usuario");
      });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...updateNameForm}>
            <form
              onSubmit={updateNameForm.handleSubmit(handleUpdateName)}
              className="space-y-4"
            >
              <FormField
                control={updateNameForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar</Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Editar Nombre
                  </Button>
                )}
              </div>
            </form>
          </Form>
          <p className="text-sm text-gray-500 mt-4">
            Correo Electrónico: {userData.email}
          </p>
        </CardContent>
      </Card>

      {(config?.role === "admin" || config?.role === "superAdmin") && (
        <Card>
          <CardHeader>
            <CardTitle>Administrar Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Form {...addUserForm}>
                <form
                  onSubmit={addUserForm.handleSubmit(handleAddUser)}
                  className="flex flex-col gap-4 lg:flex-row lg:items-end "
                >
                  <FormField
                    control={addUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="grow">
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="usuario@ejemplo.com"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSearchTerm(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="min-w-40">
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="user">Usuario</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Agregar Usuario</Button>
                </form>
              </Form>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo Electrónico</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizationUsers === undefined ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : (
                  organizationUsers
                    .filter((user) => user.role !== "superAdmin")
                    .map((user) => (
                      <TableRow key={user.userConfigId}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.userId === userData.userId}
                          >
                            Eliminar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario{" "}
              <strong>{userToDelete?.name}</strong> de la organización. No
              podrás deshacer esta acción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
