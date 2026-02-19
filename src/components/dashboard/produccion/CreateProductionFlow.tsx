"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import ProductionEntryForm from "./CreateProductionFlowLogic";
import CreateProductionOutputFlow from "./CreateProductionOutputFlow";

export default function CreateProductionFlow() {
  const [activeForm, setActiveForm] = useState<"entry" | "output" | null>(null);
  return (
    <div>
      <div className="flex gap-3 flex-wrap">
        <button
          className={cn(
            "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-60",
            activeForm === "entry" && "border-primary",
          )}
          onClick={() => setActiveForm(activeForm === "entry" ? null : "entry")}
        >
          <span
            className={cn(
              "flex size-5 text-black border border-black rounded-full justify-center items-center transition-all",
              activeForm === "entry" && "border-primary",
            )}
          >
            <PlusIcon
              className={cn(
                "size-3 transition-all",
                activeForm === "entry" && "text-primary",
              )}
            />
          </span>
          Registrar Entrada Producción
        </button>

        <button
          className={cn(
            "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-60",
            activeForm === "output" && "border-primary",
          )}
          onClick={() => setActiveForm(activeForm === "output" ? null : "output")}
        >
          <span
            className={cn(
              "flex size-5 text-black border border-black rounded-full justify-center items-center transition-all",
              activeForm === "output" && "border-primary",
            )}
          >
            <PlusIcon
              className={cn(
                "size-3 transition-all",
                activeForm === "output" && "text-primary",
              )}
            />
          </span>
          Registrar Salida Producción
        </button>
      </div>

      {activeForm === "entry" && <ProductionEntryForm />}
      {activeForm === "output" && <CreateProductionOutputFlow />}
    </div>
  );
}
