"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { LoadingSpinner } from "@/assets/icons/LoadingSpinner";
import EditSupplier from "./EditSupplier";

export default function SupplierTable() {
  const org = useQuery(api.organizations.getOrg);
  const suppliers = useQuery(api.suppliers.getSuppliers, {
    organizationId: org?._id as Id<"organizations">,
  });

  if (suppliers === undefined) {
    return (
      <div className="w-full py-6 flex justify-center items-center border border-neutral-200 rounded my-8 shadow">
        <LoadingSpinner />
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="w-full py-6 flex justify-center items-center border border-neutral-200 rounded my-8 shadow">
        <p className="text-gray text-xs">Aún no hay proveedores creados</p>
      </div>
    );
  }
  return (
    <div className="w-full py-2 border border-neutral-200 rounded my-8 shadow px-6">
      <Accordion type="multiple" className="w-full">
        {suppliers.map((supplier) => {
          return (
            <AccordionItem key={supplier._id} value={supplier._id as string}>
              <div className="flex justify-between items-center">
                <AccordionTrigger
                  className="text-xs font-medium flex justify-baseline gap-2 items-center"
                  showChevronIcon={false}
                >
                  <ChevronRight className="size-4 text-primary" />
                  {supplier.name}
                </AccordionTrigger>
                <EditSupplier supplier={supplier} />
              </div>
              <AccordionContent className="px-4 pb-4">
                <p className="text-gray text-xs whitespace-pre-wrap">
                  {supplier.details || "No hay detalles adicionales."}
                </p>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
