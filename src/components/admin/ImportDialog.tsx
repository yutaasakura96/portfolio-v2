"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiClient } from "@/lib/api-client";
import { unflattenFromCsv } from "@/lib/import-export/csv-utils";
import { validateRows } from "@/lib/import-export/validation-helpers";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CheckCircle2, FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import type { EntityConfig, ImportMode, ImportResult, ParsedRow } from "@/lib/import-export/types";

type Step = "upload" | "preview" | "importing";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: string;
  entityLabel: string;
  entityConfig: EntityConfig;
  queryKey: string[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function ImportDialog({
  open,
  onOpenChange,
  entity,
  entityLabel,
  entityConfig,
  queryKey,
}: ImportDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [mode, setMode] = useState<ImportMode>("create");
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const validRows = useMemo(() => parsedRows.filter((r) => !r.errors), [parsedRows]);
  const errorRows = useMemo(() => parsedRows.filter((r) => r.errors), [parsedRows]);

  const resetState = useCallback(() => {
    setStep("upload");
    setParsedRows([]);
    setMode("create");
    setIsImporting(false);
    setFileName("");
  }, []);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && !isImporting) {
        resetState();
      }
      onOpenChange(open);
    },
    [isImporting, onOpenChange, resetState]
  );

  const parseFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const text = await file.text();
      let rawRows: unknown[];

      if (file.name.endsWith(".csv")) {
        const result = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });
        rawRows = unflattenFromCsv(result.data, entityConfig);
      } else {
        const parsed = JSON.parse(text);
        if (entityConfig.isSingleton) {
          rawRows = [parsed];
        } else {
          rawRows = Array.isArray(parsed) ? parsed : [parsed];
        }
      }

      const validated = validateRows(rawRows, entityConfig.importSchema);
      setParsedRows(validated);
      setStep("preview");
    },
    [entityConfig]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum size is 5MB.");
        return;
      }

      parseFile(file).catch(() => {
        toast.error("Failed to parse file. Check the format and try again.");
      });
    },
    [parseFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setStep("importing");
    setIsImporting(true);

    try {
      const items = validRows.map((r) => r.data);
      let data: { items: unknown[]; mode: ImportMode } | Record<string, unknown>;

      if (entityConfig.isSingleton) {
        data = items[0] as Record<string, unknown>;
      } else {
        data = { items, mode };
      }

      const result = await apiClient.importEntity<ImportResult>(entity, data);
      const { created, updated, skipped } = result.data;

      const parts: string[] = [];
      if (created > 0) parts.push(`${created} created`);
      if (updated > 0) parts.push(`${updated} updated`);
      if (skipped > 0) parts.push(`${skipped} skipped`);
      toast.success(`Import complete: ${parts.join(", ")}`);

      onOpenChange(false);
      resetState();
      queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast.error(message);
      setStep("preview");
      setIsImporting(false);
    }
  };

  const previewColumns = useMemo(() => {
    if (parsedRows.length === 0) return [];
    const firstValid = parsedRows.find((r) => !r.errors);
    const sample = firstValid?.data ?? parsedRows[0].data;
    return Object.keys(sample as Record<string, unknown>).slice(0, 6);
  }, [parsedRows]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import {entityLabel}</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a JSON or CSV file to import data."}
            {step === "preview" && `Preview ${fileName} before importing.`}
            {step === "importing" && "Importing data..."}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Drop a file here, or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">JSON or CSV, up to 5MB</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <FileUp className="h-3 w-3" />
                {fileName}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                {validRows.length} valid
              </Badge>
              {errorRows.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errorRows.length} errors
                </Badge>
              )}
            </div>

            {!entityConfig.isSingleton && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Mode:</span>
                <Button
                  variant={mode === "create" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("create")}
                >
                  Create only
                </Button>
                <Button
                  variant={mode === "upsert" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("upsert")}
                >
                  Upsert
                </Button>
                <span className="text-xs text-muted-foreground ml-2">
                  {mode === "create"
                    ? "Skip rows that already exist"
                    : "Update existing, create new"}
                </span>
              </div>
            )}

            <div className="flex-1 overflow-auto border rounded-md">
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Status</TableHead>
                      {previewColumns.map((col) => (
                        <TableHead key={col} className="max-w-[200px]">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 100).map((row) => (
                      <TableRow
                        key={row.rowIndex}
                        className={cn(row.errors && "bg-destructive/10")}
                      >
                        <TableCell>
                          {row.errors ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[300px] text-xs">
                                {row.errors.issues
                                  .map((i) => `${i.path.join(".")}: ${i.message}`)
                                  .join("\n")}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                        </TableCell>
                        {previewColumns.map((col) => {
                          const val = (row.data as Record<string, unknown>)[col];
                          const display =
                            val === null || val === undefined
                              ? ""
                              : typeof val === "object"
                                ? JSON.stringify(val).slice(0, 50)
                                : String(val).slice(0, 50);
                          return (
                            <TableCell key={col} className="max-w-[200px] truncate text-sm">
                              {display}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
              {parsedRows.length > 100 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Showing first 100 of {parsedRows.length} rows
                </p>
              )}
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Importing {validRows.length} {entityLabel.toLowerCase()}...
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                Import {validRows.length} {validRows.length === 1 ? "row" : "rows"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
