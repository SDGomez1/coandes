
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import SideNav from "./SideNav";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MobileSideNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SideNav />
      </SheetContent>
    </Sheet>
  );
}
