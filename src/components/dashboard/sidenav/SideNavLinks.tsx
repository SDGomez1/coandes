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
  BadgeCheck,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
    title: "Almacenamiento",
    route: "/dashboard/bodega",
    icon: Warehouse,
  },
  {
    title: "Producción",
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
    title: "Gestión de Parámetros",
    route: "/dashboard/gestion-parametros",
    icon: BadgeCheck,
  },

  {
    title: "Gestión de Productos",
    route: "/dashboard/creacion-productos",
    icon: FileBox,
  },
  {
    title: "Gestión de Bodegas",
    route: "/dashboard/creacion-bodegas",
    icon: Factory,
  },
  {
    title: "Gestión de Proveedores",
    route: "/dashboard/creacion-proveedores",
    icon: BaggageClaim,
  },
];

export default function SideNavLinks() {
  const userConfig = useQuery(api.userConfig.getCurrentUserConfig);

  return (
    <>
      <div className={`flex flex-col gap-3`}>
        {mainLinks.map((data) => (
          <SideNavLink
            title={data.title}
            route={data.route}
            key={data.route}
            icon={data.icon as any}
          />
        ))}
      </div>
      {(userConfig?.role == "admin" || userConfig?.role == "superAdmin") && (
        <>
          <Separator />
          <div className={`flex flex-col gap-3`}>
            {creationLinks.map((data) => (
              <SideNavLink
                title={data.title}
                route={data.route}
                key={data.route}
                icon={data.icon}
              />
            ))}
          </div>{" "}
        </>
      )}
    </>
  );
}
