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
import EditWarehouse from "./EditWarehouse";
import { convertFromCanonical } from "@/lib/units";

export default function WarehouseTable() {
  const wareHouseData = useQuery(api.warehouse.getAvailableWarehouse);

  if (!wareHouseData || wareHouseData.length <= 0) {
    return (
      <div className="w-full py-6 flex justify-center items-center border border-neutral-200 rounded my-8 shadow">
        <p className="text-gray text-xs">Aún no hay bodegas creadas</p>
      </div>
    );
  }
  return (
    <div className="w-full py-2 border border-neutral-200 rounded my-8 shadow px-6">
      <Accordion type="multiple" className="w-full">
        {wareHouseData.map((factor) => {
          return (
            <AccordionItem key={factor._id} value={factor._id as string}>
              <div className="flex justify-between items-center">
                <AccordionTrigger
                  className="text-xs font-medium flex justify-baseline gap-2 items-center"
                  showChevronIcon={false}
                >
                  <ChevronRight className="size-4 text-primary" />
                  {factor.name}
                </AccordionTrigger>
                <EditWarehouse warehouse={factor} />
              </div>
              <AccordionContent className="px-4 pb-4">
                <ul className="list-disc pl-6 space-y-1 text-gray text-xs">
                  <li>Capacidad: {`${convertFromCanonical(factor.capacity, factor.baseUnit)} ${factor.baseUnit}`} </li>
                  <li>Filas: {factor.row} </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
