"use client";
import { Separator } from "@/components/ui/separator";
import SideNavLink from "./SideNavLink";
import {
  Package,
  ShoppingCart,
  Truck,
  Warehouse,
  Clipboard,
  FileBox,
  Factory,
  BaggageClaim,
} from "lucide-react";
export const mainLinks = [
  {
    title: "Dashboard",
    route: "/dashboard",
    icon: Clipboard,
  },
  {
    title: "Compra",
    route: "/dashboard/compra",
    icon: ShoppingCart,
  },
  {
    title: "Bodega",
    route: "/dashboard/bodega",
    icon: Warehouse,
  },
  {
    title: "Productos",
    route: "/dashboard/productos",
    icon: Package,
  },
  {
    title: "Despachos",
    route: "/dashboard/despachos",
    icon: Truck,
  },
];

export const creationLinks = [
  {
    title: "Creación de Productos",
    route: "/dashboard/creacion-productos",
    icon: FileBox,
  },
  {
    title: "Creación de Bodegas",
    route: "/dashboard/creacion-bodegas",
    icon: Factory,
  },
  {
    title: "Creación de Proveedores",
    route: "/dashboard/creacion-proveedores",
    icon: BaggageClaim,
  },
];

export default function SideNavLinks() {
  return (
    <>
      <div className="flex flex-col gap-3">
        {mainLinks.map((data) => (
          <SideNavLink
            title={data.title}
            route={data.route}
            key={data.route}
            icon={data.icon as any}
          />
        ))}
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        {creationLinks.map((data) => (
          <SideNavLink
            title={data.title}
            route={data.route}
            key={data.route}
            icon={data.icon}
          />
        ))}
      </div>
    </>
  );
}
