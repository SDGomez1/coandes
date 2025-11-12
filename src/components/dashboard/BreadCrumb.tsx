"use client";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { creationLinks, mainLinks } from "./sidenav/SideNavLinks";
import { useMemo } from "react";

export default function BreadCrumb() {
  const path = usePathname();

  const currentLink = useMemo(() => {
    const links = [...mainLinks, ...creationLinks, {title: "Configuración", route: "/dashboard/config"}];
    return links.find((l) => l.route == path);
  }, [path]);

  return (
    <Breadcrumb className="py-8">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="text-gray text-sm">{currentLink?.title}</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage className="text-gray text-sm">Coandes</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
