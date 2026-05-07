// Re-export shim — the implementation now lives in ./project-form/ split into
// orchestrator + meta fields + tag input + gallery section + mutation hook.
// Consumers continue to import from "@/components/admin/ProjectForm".
export { ProjectForm } from "./project-form/ProjectForm";
