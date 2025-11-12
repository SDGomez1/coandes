"use client";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import ReceptionForm from "./ReceptionForm";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";

export default function CreateNewPurchase() {
  const [isCreating, setIscreating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticketNumber: "",
      product: "",
      provider: "",
      warehouse: "",
      vehicleLicence: "",
      presentation: 0,
      weigth: 0,
    },
  });
  return (
    <div>
      <button
        className={cn(
          "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-48",
          isCreating && "border-primary",
        )}
        onClick={() => setIscreating(!isCreating)}
      >
        <span
          className={cn(
            "flex size-5 text-black border border-black rounded-full justify-center items-center transition-all",
            isCreating && "border-primary",
          )}
        >
          <PlusIcon
            className={cn(
              "size-3 transition-all",
              isCreating && "text-primary",
            )}
          />
        </span>
        Agregar Compra
      </button>
      {isCreating && (
        <div className="w-full border border-primary rounded-lg p-7 mt-3">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-col justify-center items-center">
              <span className="w-48 shrink h-2 bg-primary flex mb-1"></span>
              <p className="text-primary text-center text-xs">Recepción</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => {})}>
              <ReceptionForm />
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
const formSchema = z.object({
  ticketNumber: z.string(),
  product: z.string(),
  provider: z.string(),
  warehouse: z.string(),
  vehicleLicence: z.string(),
  presentation: z.number(),
  weigth: z.number(),
});
