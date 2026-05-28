"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";

interface ExportButtonsProps {
  entity: string;
  formats: ("json" | "csv")[];
}

export function ExportButtons({ entity, formats }: ExportButtonsProps) {
  const handleExport = (format: "json" | "csv") => {
    const a = document.createElement("a");
    a.href = `/api/${entity}/export?format=${format}`;
    a.click();
  };

  if (formats.length === 1) {
    return (
      <Button variant="outline" size="sm" onClick={() => handleExport(formats[0])}>
        <Download className="h-4 w-4 mr-2" />
        Export {formats[0].toUpperCase()}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => (
          <DropdownMenuItem key={format} onClick={() => handleExport(format)}>
            Export {format.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
