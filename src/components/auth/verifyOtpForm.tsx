"use client";

import { useAppSelector } from "@/store/hooks";
import { Button } from "../ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "../ui/input-otp";
import { Label } from "../ui/label";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";

export default function VerifyOtpForm() {
  const loginEmail = useAppSelector((state) => state.userData);
  const [isLoading, setIsloading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });
  return (
    <>
      <p className="font-medium text-gray-ligth mb-10 max-w-3/4">
        Te hemos enviado un correo electrónico a{" "}
        <span className="font-bold">{loginEmail.email}</span> con el código de
        acceso.{" "}
      </p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (data) => {
            setIsloading(true);
            try {
              const test = await authClient.signIn.emailOtp({
                email: loginEmail.email,
                otp: data.pin,
              });
              router.push("/dashboard");
            } catch (e) {
              toast.error("Tenemos problemas para verificar tu código");
              setIsloading(false);
            }
          })}
        >
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-ligth font-medium mb-2">
                  Ingresa el código recibido
                </FormLabel>
                <div className="mb-12 max-w-screen">
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup className="gap-6">
                        <InputOTPSlot
                          index={0}
                          className="!rounded-lg border-[#858997] xl:h-16 w-auto aspect-[31/36] xl:text-4xl text-gray border"
                        />
                        <InputOTPSlot
                          index={1}
                          className="!rounded-lg border-[#858997] xl:h-16 w-auto aspect-[31/36] xl:text-4xl text-gray border "
                        />
                        <InputOTPSlot
                          index={2}
                          className="!rounded-lg border-[#858997] xl:h-16 w-auto aspect-[31/36] xl:text-4xl text-gray border"
                        />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup className="gap-6">
                        <InputOTPSlot
                          index={3}
                          className="!rounded-lg border-[#858997] xl:h-16 w-auto aspect-[31/36] xl:text-4xl text-gray border"
                        />
                        <InputOTPSlot
                          index={4}
                          className="!rounded-lg border-[#858997] xl:h-16 w-auto aspect-[31/36] xl:text-4xl text-gray border"
                        />
                        <InputOTPSlot
                          index={5}
                          className="!rounded-lg border-[#858997] xl:h-16 w-auto aspect-[31/36] xl:text-4xl text-gray border"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          <Button className="h-16 mb-9 w-full text-white rounded bg-primary font-medium flex justify-center items-center">
            {isLoading ? <LoadingSpinner /> : "Acceder"}
          </Button>
          <p className="text-primary  underline w-full text-center my-5 hidden">
            Reenviar código (00:30)
          </p>
        </form>
      </Form>
    </>
  );
}

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});
