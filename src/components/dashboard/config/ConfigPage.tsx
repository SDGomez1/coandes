"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Id } from "convex/_generated/dataModel";

const updateNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const addUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

import { useDebounce } from "use-debounce";
import { toast } from "sonner";

export function ConfigPage({
  userData,
}: {
  userData: {
    userId: Id<"user">;
    organizationId: Id<"organizations">;
    role: string;
    name: string;
    email: string;
  };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const organizationUsers = useQuery(api.users.byOrganization, {
    organizationId: userData.organizationId,
  });

  const updateUserName = useMutation(api.betterAuth.users.updateUserName);
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
      organizationId: userData.organizationId,
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

  const handleRemoveUser = (userConfigId: Id<"userConfig">) => {
    removeUserFromOrganization({
      userConfigId: userConfigId,
      organizationId: userData.organizationId,
    })
      .then(() => {
        toast.success("Usuario eliminado correctamente");
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

      {userData.role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle>Administrar Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Form {...addUserForm}>
                <form
                  onSubmit={addUserForm.handleSubmit(handleAddUser)}
                  className="flex items-end space-x-4"
                >
                  <FormField
                    control={addUserForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-grow">
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
                            <SelectTrigger>
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
                            onClick={() => handleRemoveUser(user.userConfigId)}
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
    </div>
  );
}

