"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";
import type { NavItem } from "./nav-item";
import { NavList } from "./nav-list";

interface MobileNavProps {
  items: readonly NavItem[];
  exactHrefs: readonly string[];
  labels: { open: string; close: string; title: string; navigation: string };
}

/** Off-canvas navigation for screens without the persistent sidebar. */
export function MobileNav({ items, exactHrefs, labels }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={labels.open}
        className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>
      <SheetContent title={labels.title} closeLabel={labels.close}>
        <NavList
          items={items}
          label={labels.navigation}
          exactHrefs={exactHrefs}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
