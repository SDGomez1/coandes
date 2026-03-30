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
import EditCustomer from "./EditCustomer";

export default function CustomerTable() {
  const org = useQuery(api.organizations.getOrg);
  const customers = useQuery(
    api.customers.getCustomers,
    org?._id ? { organizationId: org._id as Id<"organizations"> } : "skip",
  );

  if (customers === undefined) {
    return (
      <div className="w-full py-6 flex justify-center items-center border border-neutral-200 rounded my-8 shadow">
        <LoadingSpinner />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="w-full py-6 flex justify-center items-center border border-neutral-200 rounded my-8 shadow">
        <p className="text-gray text-xs">Aún no hay clientes creados</p>
      </div>
    );
  }

  return (
    <div className="w-full py-2 border border-neutral-200 rounded my-8 shadow px-6">
      <Accordion type="multiple" className="w-full">
        {customers.map((customer) => (
          <AccordionItem key={customer._id} value={customer._id as string}>
            <div className="flex justify-between items-center">
              <AccordionTrigger
                className="text-xs font-medium flex justify-baseline gap-2 items-center"
                showChevronIcon={false}
              >
                <ChevronRight className="size-4 text-primary" />
                {customer.name}
              </AccordionTrigger>
              <EditCustomer customer={customer} />
            </div>
            <AccordionContent className="px-4 pb-4">
              <p className="text-gray text-xs whitespace-pre-wrap">
                {customer.details || "No hay detalles adicionales."}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
