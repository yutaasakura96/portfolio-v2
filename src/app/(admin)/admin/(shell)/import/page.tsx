"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { entityConfigs } from "@/lib/import-export";
import { validateUnifiedImport } from "@/lib/import-export/unified-import";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type {
  ImportMode,
  UnifiedImportResult,
  UnifiedValidationSummary,
} from "@/lib/import-export/types";

type Step = "upload" | "preview" | "importing" | "done";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ENTITY_LABELS: Record<string, string> = {};
for (const [key, config] of Object.entries(entityConfigs)) {
  ENTITY_LABELS[key] = config.pluralLabel;
}

export default function UnifiedImportPage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<ImportMode>("create");
  const [rawPayload, setRawPayload] = useState<Record<string, unknown>>({});
  const [validation, setValidation] = useState<UnifiedValidationSummary>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<UnifiedImportResult | null>(null);

  const entityKeys = useMemo(() => Object.keys(validation), [validation]);

  const totalValid = useMemo(
    () => entityKeys.reduce((sum, k) => sum + validation[k].validCount, 0),
    [entityKeys, validation]
  );

  const totalErrors = useMemo(
    () => entityKeys.reduce((sum, k) => sum + validation[k].errorCount, 0),
    [entityKeys, validation]
  );

  const resetState = useCallback(() => {
    setStep("upload");
    setFileName("");
    setMode("create");
    setRawPayload({});
    setValidation({});
    setIsImporting(false);
    setImportResult(null);
  }, []);

  const parseFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("File must contain a JSON object with entity keys.");
    }

    const { mode: _mode, ...entities } = parsed as Record<string, unknown>;
    const summary = validateUnifiedImport(entities);

    if (Object.keys(summary).length === 0) {
      throw new Error(
        "No importable entities found. Expected keys like: projects, blog, skills, hero, etc."
      );
    }

    setRawPayload(entities);
    setValidation(summary);
    setStep("preview");
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }

      parseFile(file).catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to parse file.";
        toast.error(message);
      });
    },
    [parseFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleImport = async () => {
    if (totalValid === 0) return;
    setStep("importing");
    setIsImporting(true);

    try {
      const payload: Record<string, unknown> = { mode };
      for (const [key, summary] of Object.entries(validation)) {
        const config = entityConfigs[key];
        if (summary.validCount === 0) continue;

        if (config.isSingleton) {
          payload[key] = summary.validItems[0];
        } else {
          payload[key] = summary.validItems;
        }
      }

      const result = await apiClient.importUnified<UnifiedImportResult>(payload);
      setImportResult(result.data);
      setStep("done");

      const parts: string[] = [];
      if (result.data.totalCreated > 0) parts.push(`${result.data.totalCreated} created`);
      if (result.data.totalUpdated > 0) parts.push(`${result.data.totalUpdated} updated`);
      if (result.data.totalSkipped > 0) parts.push(`${result.data.totalSkipped} skipped`);
      toast.success(`Import complete: ${parts.join(", ")}`);

      for (const config of Object.values(entityConfigs)) {
        queryClient.invalidateQueries({ queryKey: config.queryKey });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast.error(message);
      setStep("preview");
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unified Import & Export</h1>
          <p className="text-muted-foreground">
            Import or export all entities as a single JSON file.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            const a = document.createElement("a");
            a.href = "/api/admin/export/unified?format=json";
            a.click();
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Export All (JSON)
        </Button>
      </div>

      {step === "upload" && (
        <Card>
          <CardContent className="pt-6">
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
                <p className="font-medium">Drop a JSON file here, or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  JSON file with entity keys (projects, blog, skills, etc.), up to 10MB
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Expected format:</p>
              <pre className="overflow-x-auto text-xs">
                {`{
  "projects": [ { "title": "...", "slug": "...", ... } ],
  "skills": [ { "name": "...", "category": "...", ... } ],
  "hero": { "headline": "...", ... },
  ...
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <FileUp className="h-3 w-3" />
                {fileName}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                {totalValid} valid
              </Badge>
              {totalErrors > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {totalErrors} errors
                </Badge>
              )}
            </div>
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
            </div>
          </div>

          {entityKeys.map((key) => (
            <EntityPreviewCard key={key} entityKey={key} summary={validation[key]} />
          ))}

          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" onClick={resetState}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleImport} disabled={totalValid === 0}>
              Import {totalValid} {totalValid === 1 ? "item" : "items"} across{" "}
              {entityKeys.filter((k) => validation[k].validCount > 0).length} entities
            </Button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Importing {totalValid} items across {entityKeys.length} entities...
            </p>
          </CardContent>
        </Card>
      )}

      {step === "done" && importResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Complete</CardTitle>
              <CardDescription>
                {importResult.totalCreated} created, {importResult.totalUpdated} updated,{" "}
                {importResult.totalSkipped} skipped
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(importResult.results).map(([key, result]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <span className="font-medium">{ENTITY_LABELS[key] || key}</span>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      {result.created > 0 && (
                        <span className="text-green-600 dark:text-green-400">
                          +{result.created}
                        </span>
                      )}
                      {result.updated > 0 && (
                        <span className="text-blue-600 dark:text-blue-400">~{result.updated}</span>
                      )}
                      {result.skipped > 0 && (
                        <span className="text-muted-foreground">-{result.skipped}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={resetState}>Import Another File</Button>
        </div>
      )}
    </div>
  );
}

function EntityPreviewCard({
  entityKey,
  summary,
}: {
  entityKey: string;
  summary: UnifiedValidationSummary[string];
}) {
  const [open, setOpen] = useState(false);
  const config = entityConfigs[entityKey];
  const label = config?.pluralLabel ?? entityKey;

  const previewColumns = useMemo(() => {
    const sample = summary.validItems[0];
    if (!sample) return [];
    return Object.keys(sample).slice(0, 5);
  }, [summary.validItems]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{label}</CardTitle>
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  {summary.validCount}
                </Badge>
                {summary.errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {summary.errorCount}
                  </Badge>
                )}
                {config?.isSingleton && <Badge variant="outline">Singleton</Badge>}
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {summary.errors.length > 0 && (
              <div className="mb-3 rounded-md bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive mb-1">
                  {summary.errorCount} {summary.errorCount === 1 ? "row" : "rows"} with errors (will
                  be skipped):
                </p>
                <ul className="text-xs text-destructive space-y-1">
                  {summary.errors.slice(0, 5).map((err) => (
                    <li key={err.index}>
                      Row {err.index + 1}: {err.messages.join(", ")}
                    </li>
                  ))}
                  {summary.errors.length > 5 && <li>...and {summary.errors.length - 5} more</li>}
                </ul>
              </div>
            )}

            {summary.validItems.length > 0 && previewColumns.length > 0 && (
              <div className="overflow-auto border rounded-md">
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {previewColumns.map((col) => (
                          <TableHead key={col} className="max-w-[200px]">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.validItems.slice(0, 20).map((item, idx) => (
                        <TableRow key={idx}>
                          {previewColumns.map((col) => {
                            const val = item[col];
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
                {summary.validItems.length > 20 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    Showing first 20 of {summary.validItems.length} items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
