"use client";

import { useState } from "react";

import { ExportButtons } from "@/components/admin/ExportButtons";
import { ImportDialog } from "@/components/admin/ImportDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

import type { EntityConfig } from "@/lib/import-export/types";

interface ImportExportToolbarProps {
  entity: string;
  entityLabel: string;
  entityConfig: EntityConfig;
  queryKey: string[];
}

export function ImportExportToolbar({
  entity,
  entityLabel,
  entityConfig,
  queryKey,
}: ImportExportToolbarProps) {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <ExportButtons entity={entity} formats={entityConfig.formats} />
      {!entityConfig.importDisabled && (
        <>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <ImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            entity={entity}
            entityLabel={entityLabel}
            entityConfig={entityConfig}
            queryKey={queryKey}
          />
        </>
      )}
    </div>
  );
}
