export type BrickLibraryItem = {
  id: string;
  name: string;
  summary: string;
  packageId: string;
  version: string;
  license: string;
  dependencies: string[];
  compat: string;
  source: "builtin" | "imported";
  category: string;
  installState: "ready" | "incomplete" | "blocked";
  importIssues: string[];
  rollbackAvailable: boolean;
  compositeChildren?: Array<{ id: string; type: string }>;
};

export type BrickImportPreview = {
  item: BrickLibraryItem | null;
  issues: string[];
  sourceType: "manifest" | "packages" | "lockfile" | "package_lock" | "artifact" | "unknown";
};
