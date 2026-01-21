"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import ProductionForm from "./CreateProductionFlowLogic";


export default function CreateProductionFlow() {
  const [isCreating, setIsCreating] = useState(false);
  return (
    <div>
      <button
        className={cn(
          "flex gap-2 text-xs justify-center items-center border-[#EBE9E9] shadow p-2 rounded border hover:shadow-lg transition-all cursor-pointer w-56",
          isCreating && "border-primary",
        )}
        onClick={() => setIsCreating(!isCreating)}
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
        Registrar Nueva Producción
      </button>
      {isCreating && <ProductionForm />}
    </div>
  );
}
