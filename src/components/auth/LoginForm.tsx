"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAppDispatch } from "@/store/hooks";
import { useState } from "react";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import { toast } from "sonner";
import { setUserEmail } from "@/store/features/userData/userDataSlice";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function LoginForm() {
  authClient.useSession();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const userExistsByEmail = useMutation(api.users.userExistsByEmail);
  const formSchema = z.object({
    email: z.string().email(),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          setIsLoading(true);
          try {
            const exists = await userExistsByEmail({
              email: data.email,
            });
            if (!exists) {
              toast.error("El usuario no existe");
              setIsLoading(false);
              return;
            }
            dispatch(setUserEmail(data.email));
            await authClient.emailOtp.sendVerificationOtp({
              email: data.email,
              type: "sign-in",
            });
            router.push("/auth/verifyOtp");
          } catch (e) {
            toast.error(
              "Tenemos problemas para enviar el código. Intentalo más tarde",
            );
            setIsLoading(false);
            return;
          }
        })}
      >
        <FormField
          name="email"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm text-gray-ligth font-normal mb-2">
                Usuario o correo electrónico
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Usuario o correo electrónico"
                  className="h-16 mb-11"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          className="h-16 mb-9 w-full text-white rounded bg-primary font-medium flex justify-center items-center"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : "Continuar"}
        </Button>
      </form>
    </Form>
  );
}
