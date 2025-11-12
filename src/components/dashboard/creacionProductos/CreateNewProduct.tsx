"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CancelConfirmation } from "./CancelConfirmation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

// ------------------- Schema -------------------
const qualityItemSchema = z.object({
  label: z.string().min(1, "El nombre del item es requerido"),
  selected: z.boolean(),
});

const qualityParameterSchema = z.object({
  name: z.string().min(1, "El nombre del parámetro es requerido"),
  items: z.array(qualityItemSchema),
});

const productSchema = z.object({
  productName: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El código es requerido"),
  unitBase: z.string().min(1),
  presentation: z.string(),
  equivalence: z.string().optional(),
  averageWeight: z.string().optional(),
  qualityFactorsId: z.array(z.string()),
  qualityParameters: z.array(qualityParameterSchema),
});

export type ProductFormType = z.infer<typeof productSchema>;

export default function CreateNewProduct({}) {
  const [step, setStep] = useState(1);
  const createProductWithParams = useMutation(
    api.productTypes.createProductTypeWithParameters,
  );
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const [open, setOpen] = useState(false);

  const methods = useForm<ProductFormType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      sku: "",
      equivalence: "1",
      presentation: "",
      averageWeight: "50",
      unitBase: "",
      qualityFactorsId: [],
      qualityParameters: [],
    },
    mode: "onChange",
  });

  const { trigger, handleSubmit, reset, formState } = methods;

  const stepFields: Record<number, (keyof ProductFormType)[]> = {
    1: ["productName", "sku"],
    2: ["unitBase", "presentation", "equivalence", "averageWeight"],
    3: ["qualityFactorsId", "qualityParameters"],
  };

  const nextStep = async () => {
    const currentFields = stepFields[step];
    const isValid = await trigger(currentFields as any);
    if (!isValid) return;
    setStep((p) => Math.min(p + 1, 3));
  };

  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  const onSubmit = async (data: ProductFormType) => {
    const payload = {
      name: data.productName,
      sku: data.sku,
      baseUnit: data.unitBase,
      presentation: data.presentation,
      equivalence: data.equivalence ?? "",
      averageWeigth: data.averageWeight ?? "",
      qualityFactorsId: data.qualityFactorsId.map(
        (s) => s as unknown as Id<"qualityFactors">,
      ),
      qualityParameters: data.qualityParameters.map((p) => ({
        name: p.name,
        items: p.items.map((i) => ({
          label: i.label,
          selected: !!i.selected,
        })),
      })),
    };

    try {
      const result = await createProductWithParams(payload);
      console.log("Product created:", result);
      setStep(1);
      reset();

      setOpen(false);
    } catch (err) {
      console.error("Error creating product:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <span className="flex size-5 text-black border border-black rounded-full justify-center items-center">
          <XIcon className="rotate-45 size-3" />
        </span>
        Crear un nuevo producto
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="p-0 border-none ring-none h-[60vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="bg-primary w-full h-12 rounded-t-lg" />
        {cancelConfirm ? (
          <CancelConfirmation
            onBack={() => setCancelConfirm(false)}
            onConfirm={() => {
              setStep(1);
              setCancelConfirm(false);
              reset();
              setOpen(false);
            }}
          />
        ) : (
          <Form {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit, (e) => console.log(e))}
              className="px-9 flex flex-col h-full  overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center ">
                  <span className="bg-primary size-11 rounded-full flex justify-center items-center text-white font-medium shrink-0">
                    1
                  </span>
                  <Separator
                    className={cn("shrink", step > 1 ? "bg-primary" : "")}
                  />
                  <span
                    className={cn(
                      "bg-white border border-primary size-11 rounded-full flex justify-center items-center text-primary font-medium shrink-0",
                      step > 1 && "bg-primary text-white",
                    )}
                  >
                    2
                  </span>
                  <Separator
                    className={cn("shrink", step > 2 ? "bg-primary" : "")}
                  />
                  <span
                    className={cn(
                      "bg-white border border-primary size-11 rounded-full flex justify-center items-center text-primary font-medium shrink-0",
                      step > 2 && "bg-primary text-white",
                    )}
                  >
                    3
                  </span>
                </div>

                {step === 1 && <StepOne />}
                {step === 2 && <StepTwo />}
                {step === 3 && <StepThree />}

                <div className="flex justify-between mt-auto gap-4 pt-4 pb-11">
                  {step === 1 ? (
                    <Button
                      type="button"
                      className="w-1/2 shrink"
                      variant="outline"
                      onClick={() => setCancelConfirm(true)}
                    >
                      Cancelar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={prevStep}
                      disabled={step === 1}
                      variant="outline"
                      className="w-1/2 shrink"
                    >
                      Volver
                    </Button>
                  )}

                  {step > 1 && (
                    <Button
                      type="button"
                      className="w-1/2 shrink"
                      onClick={() => setCancelConfirm(true)}
                    >
                      Cancelar
                    </Button>
                  )}

                  {step < 3 && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-primary px-4 py-2 text-white w-1/2 shrink"
                    >
                      Continuar
                    </Button>
                  )}

                  {step === 3 && (
                    <Button
                      type="submit"
                      className="bg-primary px-4 py-2 rounded text-white w-1/2 shrink"
                    >
                      Terminar
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
