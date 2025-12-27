"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import StepFour from "./StepFour";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CancelConfirmation } from "./CancelConfirmation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { convertToCanonical } from "@/lib/units";

// ------------------- Schema -------------------

const productSchema = z.object({
  productName: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El código es requerido"),
  type: z.enum(["Raw Material", "Finished Good", "By-product"]),
  unitBase: z.enum(["g", "kg", "lb", "oz", "ton"]),
  presentation: z.string(),
  equivalence: z.string(),
  averageWeight: z.number().nonnegative(),
  qualityFactorsId: z.array(z.string()),
  outputProductIds: z.array(z.string()).optional(),
});

export type ProductFormType = z.infer<typeof productSchema>;

export default function CreateNewProduct({}) {
  const [step, setStep] = useState(1);
  const org = useQuery(api.organizations.getOrg);
  const createProduct = useMutation(api.products.createProduct);
  const defineProductOutput = useMutation(api.products.defineProductOutput);

  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [open, setOpen] = useState(false);

  const methods = useForm<ProductFormType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      sku: "",
      type: "Raw Material",
      equivalence: "1",
      presentation: "",
      averageWeight: 5,
      unitBase: "kg",
      qualityFactorsId: [],
      outputProductIds: [],
    },
    mode: "onChange",
  });

  const { control, trigger, handleSubmit, reset } = methods;

  const productType = useWatch({ control, name: "type" });
  const isProducible =
    productType === "Raw Material" || productType === "By-product";
  const maxSteps = isProducible ? 4 : 3;

  const stepFields: Record<number, (keyof ProductFormType)[]> = {
    1: ["productName", "sku", "type"],
    2: ["unitBase", "presentation", "equivalence", "averageWeight"],
    3: ["qualityFactorsId"],
    4: ["outputProductIds"],
  };

  const nextStep = async () => {
    const currentFields = stepFields[step];
    const isValid = await trigger(currentFields as any);
    if (!isValid) return;
    setStep((p) => Math.min(p + 1, maxSteps));
  };

  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  const onSubmit = async (data: ProductFormType) => {
    try {
      const newProductId = await createProduct({
        organizationId: org?._id as Id<"organizations">,
        name: data.productName,
        sku: data.sku,
        type: data.type,
        baseUnit: data.unitBase,
        presentation: data.presentation,
        equivalence: data.equivalence ?? "",
        averageWeigth: convertToCanonical(data.averageWeight, data.unitBase),
        qualityFactorsId: data.qualityFactorsId.map(
          (s) => s as Id<"qualityFactors">,
        ),
      });

      if (
        isProducible &&
        data.outputProductIds &&
        data.outputProductIds.length > 0
      ) {
        for (const outputId of data.outputProductIds) {
          await defineProductOutput({
            organizationId: org?._id as Id<"organizations">,
            inputProductId: newProductId,
            outputProductId: outputId as Id<"products">,
          });
        }
      }

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
                  {/* Step 1 */}
                  <span className="bg-primary size-11 rounded-full flex justify-center items-center text-white font-medium shrink-0">
                    1
                  </span>
                  <Separator
                    className={cn("shrink", step > 1 ? "bg-primary" : "")}
                  />
                  {/* Step 2 */}
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
                  {/* Step 3 */}
                  <span
                    className={cn(
                      "bg-white border border-primary size-11 rounded-full flex justify-center items-center text-primary font-medium shrink-0",
                      step > 2 && "bg-primary text-white",
                    )}
                  >
                    3
                  </span>
                  {/* Step 4 (Conditional) */}
                  {isProducible && (
                    <>
                      <Separator
                        className={cn("shrink", step > 3 ? "bg-primary" : "")}
                      />
                      <span
                        className={cn(
                          "bg-white border border-primary size-11 rounded-full flex justify-center items-center text-primary font-medium shrink-0",
                          step > 3 && "bg-primary text-white",
                        )}
                      >
                        4
                      </span>
                    </>
                  )}
                </div>

                {step === 1 && <StepOne />}
                {step === 2 && <StepTwo />}
                {step === 3 && <StepThree />}
                {step === 4 && isProducible && <StepFour />}

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

                  {step < maxSteps && (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-primary px-4 py-2 text-white w-1/2 shrink"
                    >
                      Continuar
                    </Button>
                  )}

                  {step === maxSteps && (
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
