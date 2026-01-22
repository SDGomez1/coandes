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
import MobileSideNav from "./sidenav/MobileSideNav";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function BreadCrumb() {
  const path = usePathname();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const currentLink = useMemo(() => {
    const links = [
      ...mainLinks,
      ...creationLinks,
      { title: "Configuración", route: "/dashboard/config" },
    ];
    return links.find((l) => l.route == path);
  }, [path]);

  return (
    <div className="flex justify-between items-center">
      {!isDesktop && <MobileSideNav />}
      <Breadcrumb className="py-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray text-sm">
              {currentLink?.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-gray text-sm">
              Coandes
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
