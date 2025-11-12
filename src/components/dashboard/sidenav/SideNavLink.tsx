"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentType } from "react";

type SideNavLinkProps = {
  title: string;
  route: string;
  icon: ComponentType<{ className?: string }>;
};

export default function SideNavLink({ title, route, icon: Icon }: SideNavLinkProps) {
  const path = usePathname();

  return (
    <Link href={route}>
      <div className="flex justify-between items-center text-gray">
        <div className="flex gap-4 text-sm items-center">
          {Icon && (
            <span
              className={cn(
                "flex items-center justify-center size-12 rounded-full",
                path === route ? "bg-primary text-white" : "bg-none text-gray"
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  path === route ? "text-white" : "text-gray-500"
                )}
              />
            </span>
          )}
          <p className={cn(path === route ? "text-primary" : "text-gray-600")}>
            {title}
          </p>
        </div>
        <ChevronRight
          className={cn(
            "size-4",
            path === route ? "text-primary" : "text-gray"
          )}
        />
      </div>
    </Link>
  );
}
