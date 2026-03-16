import { useMemo, useRef, useState } from "react";
import { useI18n } from "./i18n/I18nProvider";

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

type BrickAuthoringTemplate = "door" | "switch" | "trigger-zone" | "ladder" | "enemy" | "composite" | "ability-set";

type BrickAuthoringDraft = {
  template: BrickAuthoringTemplate;
  id: string;
  name: string;
  packageId: string;
  version: string;
  summary: string;
  category: string;
  license: string;
};

type BrickAuthoringCheckItem = {
  category: string;
  status: "ready" | "warning";
  detail: string;
};

type BrickLibraryPanelProps = {
  items: BrickLibraryItem[];
  selectedId: string;
  recentIds: string[];
  recommendedIds: string[];
  highlightedIds?: string[];
  onSelect: (id: string) => void;
  onAddToScene: (id: string) => void;
  onQuickPreview: (id: string) => void;
  onOpenSample: (sampleId: "forest-cabin" | "basketball-court" | "patrol-guard") => void;
  onImportBrick: (json: string) => { ok: boolean; message: string };
  onPreviewBrick: (json: string) => BrickImportPreview;
  onRemoveBrick: (id: string) => { ok: boolean; message: string };
  onRollbackBrick: (id: string) => { ok: boolean; message: string };
  onExportLockfile: () => void;
};

const DRAG_BRICK_MIME = "application/x-fate-brick-id";

const panelTitleStyle = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
  color: "#1e2f43",
} as const;

const actionMenuPanelStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  right: 0,
  minWidth: "172px",
  padding: "6px",
  borderRadius: "10px",
  border: "1px solid #dbe2eb",
  background: "#ffffff",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
  zIndex: 10,
} as const;

const actionMenuItemStyle = {
  padding: "8px 10px",
  borderRadius: "8px",
  color: "#304255",
  fontSize: "13px",
  cursor: "pointer",
} as const;

const getBrickAccent = (category: string): { background: string; border: string; label: string } => {
  if (category === "ability") {
    return { background: "linear-gradient(135deg, #fff5d6 0%, #f1c86d 100%)", border: "#d0a64a", label: "ABILITY" };
  }
  if (category === "enemy") {
    return { background: "linear-gradient(135deg, #ffd9d1 0%, #d86a58 100%)", border: "#ba5b49", label: "ENEMY" };
  }
  if (category === "composite") {
    return { background: "linear-gradient(135deg, #dff1ff 0%, #6ca6d8 100%)", border: "#5b90be", label: "COMPOSITE" };
  }
  return { background: "linear-gradient(135deg, #eaf1fb 0%, #8aa7cc 100%)", border: "#7d9abf", label: "BRICK" };
};

const getBrickPreviewSrc = (item: BrickLibraryItem): string | undefined => {
  if (item.id === "basketball-court") {
    return "/tests/visual-baseline/trigger-zone-door-link.png";
  }
  if (item.id === "small-house" || item.id === "warehouse-zone") {
    return "/tests/visual-baseline/default.png";
  }
  if (item.id === "patrol-guard") {
    return "/tests/visual-baseline/default.png";
  }
  if (item.id === "basketball-ability" || item.category === "ability") {
    return "/tests/visual-baseline/trigger-zone-door-link.png";
  }
  if (item.id.includes("ladder") || item.category === "ladder") {
    return "/tests/visual-baseline/ladder-door-link.png";
  }
  if (item.id.includes("switch") || item.category === "switch") {
    return "/tests/visual-baseline/switch-door-link.png";
  }
  if (item.id.includes("trigger-zone") || item.category === "trigger-zone") {
    return "/tests/visual-baseline/trigger-zone-door-link.png";
  }
  if (item.id.includes("door")) {
    return "/tests/visual-baseline/door-lock-unlock.png";
  }
  if (item.category === "composite") {
    return "/tests/visual-baseline/default.png";
  }
  return undefined;
};

const createBrickPreviewUri = (item: BrickLibraryItem): string => {
  const realPreview = getBrickPreviewSrc(item);
  if (typeof realPreview === "string") {
    return realPreview;
  }
  const accent = getBrickAccent(item.category);
  const safeName = item.name.slice(0, 20);
  const safeCategory = item.category.slice(0, 18);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${accent.border}"/>
          <stop offset="100%" stop-color="#f4f7fb"/>
        </linearGradient>
      </defs>
      <rect width="320" height="180" rx="18" fill="url(#bg)"/>
      <rect x="18" y="18" width="118" height="70" rx="12" fill="rgba(255,255,255,0.32)"/>
      <rect x="152" y="32" width="120" height="16" rx="8" fill="rgba(19,34,56,0.18)"/>
      <rect x="152" y="58" width="88" height="12" rx="6" fill="rgba(19,34,56,0.12)"/>
      <rect x="28" y="108" width="264" height="42" rx="14" fill="rgba(255,255,255,0.54)"/>
      <text x="28" y="42" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#132238">${accent.label}</text>
      <text x="28" y="132" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#132238">${safeName}</text>
      <text x="28" y="154" font-family="Arial, sans-serif" font-size="13" fill="#31455d">${safeCategory}</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const renderBrickCard = (
  item: BrickLibraryItem,
  isSelected: boolean,
  isHighlighted: boolean,
  t: ReturnType<typeof useI18n>["t"],
  actions: JSX.Element[],
  expandedCompositeIds: string[],
  setExpandedCompositeIds: React.Dispatch<React.SetStateAction<string[]>>,
  onSelect: (id: string) => void,
  onRemoveBrick: (id: string) => { ok: boolean; message: string },
  onRollbackBrick: (id: string) => { ok: boolean; message: string },
  setImportMessage: React.Dispatch<React.SetStateAction<string>>,
): JSX.Element => {
  const accent = getBrickAccent(item.category);
  const shellStyle = {
    display: "grid",
    gap: "10px",
    padding: "12px",
    borderRadius: "10px",
    border: isSelected ? "1px solid #8bb0d9" : isHighlighted ? "1px solid #d3b778" : "1px solid #dde4ec",
    background: isSelected ? "#f4f8fd" : isHighlighted ? "#fffaf0" : "#ffffff",
  } as const;
  return (
    <article
      key={`${item.source}-${item.id}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_BRICK_MIME, item.id);
        event.dataTransfer.effectAllowed = "copy";
      }}
      style={shellStyle}
    >
      <div
        style={{
          minHeight: "110px",
          borderRadius: "12px",
          padding: "12px",
          display: "grid",
          alignContent: "space-between",
          background: accent.background,
          border: `1px solid ${accent.border}`,
          backgroundImage: `url("${createBrickPreviewUri(item)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "start" }}>
          <span style={{ fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700, color: "#203249" }}>{accent.label}</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "end" }}>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: item.source === "builtin" ? "#d8ebff" : "#e9f4da", color: "#21416d" }}>
              {item.source === "builtin" ? t("panel.brickLibrary.sourceBuiltin") : t("panel.brickLibrary.sourceImported")}
            </span>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: item.installState === "ready" ? "#ddf5df" : item.installState === "blocked" ? "#ffe3de" : "#fff1cf", color: item.installState === "blocked" ? "#7d2c1f" : "#5b4300" }}>
              {item.installState === "ready" ? t("panel.brickLibrary.statusReady") : item.installState === "blocked" ? t("panel.brickLibrary.statusBlocked") : t("panel.brickLibrary.statusIncomplete")}
            </span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#132238" }}>{item.name}</div>
          <div style={{ fontSize: "12px", color: "#31455d", marginTop: "4px" }}>{item.category}</div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12px", color: "#73859b" }}>{item.packageId}@{item.version}</div>
        <div style={{ fontSize: "12px", color: "#43566b", marginTop: "6px" }}>{item.summary}</div>
      </div>
      <div style={{ fontSize: "12px", color: "#b8c6d4" }}>
        {t("panel.brickLibrary.meta", {
          license: item.license,
          compat: item.compat,
          dependencyCount: String(item.dependencies.length),
        })}
      </div>

      {item.importIssues.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: "18px", color: "#f0d79f", fontSize: "12px" }}>
          {item.importIssues.slice(0, 3).map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
      {expandedCompositeIds.includes(item.id) && (item.compositeChildren?.length ?? 0) > 0 ? (
        <div style={{ display: "grid", gap: "4px", padding: "8px 10px", borderRadius: "8px", background: "#202a36", border: "1px solid #394759" }}>
          <strong style={{ fontSize: "12px", color: "#e8eff7" }}>{t("panel.brickLibrary.childrenTitle")}</strong>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#b7c4d3" }}>
            {item.compositeChildren?.map((child) => (
              <li key={`${item.id}-${child.id}`}>
                {child.id}
                {" -> "}
                {child.type}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          style={{ padding: 0, border: "none", background: "transparent", color: "#284c75", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
        >
          {t("panel.brickLibrary.inspect")}
        </button>
        <details style={{ position: "relative" }}>
          <summary style={{ listStyle: "none", cursor: "pointer", padding: "6px 10px", borderRadius: "8px", border: "1px solid #d5dde7", background: "#ffffff", color: "#314357", fontSize: "12px", fontWeight: 700 }}>
            操作
          </summary>
          <div role="menu" style={actionMenuPanelStyle}>
            {actions.map((action, index) => (
              <div key={`${item.id}-action-${index}`} style={actionMenuItemStyle}>
                {action}
              </div>
            ))}
            {item.category === "composite" && (item.compositeChildren?.length ?? 0) > 0 ? (
              <div
                role="menuitem"
                tabIndex={0}
                style={actionMenuItemStyle}
                onClick={() => setExpandedCompositeIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedCompositeIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
                  }
                }}
              >
                {expandedCompositeIds.includes(item.id) ? t("panel.brickLibrary.hideChildren") : t("panel.brickLibrary.showChildren")}
              </div>
            ) : null}
            {item.source === "imported" ? (
              <div
                role="menuitem"
                tabIndex={0}
                style={actionMenuItemStyle}
                onClick={() => setImportMessage(onRemoveBrick(item.id).message)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setImportMessage(onRemoveBrick(item.id).message);
                  }
                }}
              >
                {t("panel.brickLibrary.remove")}
              </div>
            ) : null}
            {item.source === "imported" && item.rollbackAvailable ? (
              <div
                role="menuitem"
                tabIndex={0}
                style={actionMenuItemStyle}
                onClick={() => setImportMessage(onRollbackBrick(item.id).message)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setImportMessage(onRollbackBrick(item.id).message);
                  }
                }}
              >
                {t("panel.brickLibrary.rollback")}
              </div>
            ) : null}
          </div>
        </details>
      </div>
    </article>
  );
};

const createAuthoringTemplateManifest = (draft: BrickAuthoringDraft): string => {
  const base = {
    id: draft.id,
    name: draft.name,
    package_id: draft.packageId,
    version: draft.version,
    summary: draft.summary,
    category: draft.category,
    license: draft.license,
    compat: "editor>=0.1.0",
  };

  const byTemplate: Record<BrickAuthoringTemplate, Record<string, unknown>> = {
    door: {
      ...base,
      runtime_kind: "door",
      properties: [
        { key: "locked", label: "Locked", type: "boolean", defaultValue: false, description: "Whether the door is locked by default." },
        { key: "openAngle", label: "Open Angle", type: "number", defaultValue: 90, description: "Open angle in degrees." },
      ],
      slots: [
        { slotId: "mesh", label: "Door Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-door" },
        { slotId: "sfx-open", label: "Open SFX", optional: true, fallbackAssetRef: "asset://audio/default-door-open" },
      ],
      ports: [
        { id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when the door is used." },
        { id: "on-denied", name: "OnDenied", direction: "output", dataType: "event", description: "Emitted when interaction is denied." },
      ],
    },
    switch: {
      ...base,
      runtime_kind: "switch",
      properties: [
        { key: "enabled", label: "Enabled", type: "boolean", defaultValue: true, description: "Whether the switch is enabled." },
        { key: "active", label: "Active", type: "boolean", defaultValue: false, description: "Initial switch state." },
      ],
      slots: [{ slotId: "mesh", label: "Switch Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-switch" }],
      ports: [{ id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when the switch changes state." }],
    },
    "trigger-zone": {
      ...base,
      runtime_kind: "trigger-zone",
      properties: [{ key: "enabled", label: "Enabled", type: "boolean", defaultValue: true, description: "Whether the trigger zone is enabled." }],
      slots: [{ slotId: "vfx-enter", label: "Enter VFX", optional: true, fallbackAssetRef: "asset://vfx/default-enter" }],
      ports: [{ id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when an actor enters or exits the zone." }],
    },
    ladder: {
      ...base,
      runtime_kind: "ladder",
      properties: [
        { key: "enabled", label: "Enabled", type: "boolean", defaultValue: true, description: "Whether the ladder is enabled." },
        { key: "has_top_anchor", label: "Top Anchor", type: "boolean", defaultValue: true, description: "Whether the ladder has a valid top anchor." },
      ],
      slots: [{ slotId: "mesh", label: "Ladder Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-ladder" }],
      ports: [{ id: "on-used", name: "OnUsed", direction: "output", dataType: "event", description: "Emitted when climbing starts or ends." }],
    },
    enemy: {
      ...base,
      runtime_kind: "generic",
      properties: [
        { key: "health", label: "Health", type: "number", defaultValue: 100, description: "Base health value." },
        { key: "patrolRoute", label: "Patrol Route", type: "string", defaultValue: "route_a", description: "Patrol route id." },
        { key: "attackStyle", label: "Attack Style", type: "string", defaultValue: "melee_basic", description: "Default attack style identifier." },
      ],
      slots: [
        { slotId: "mesh", label: "Enemy Mesh", optional: false, fallbackAssetRef: "asset://mesh/default-enemy" },
        { slotId: "anim-idle", label: "Idle Animation", optional: true, fallbackAssetRef: "asset://anim/default-idle" },
      ],
      ports: [{ id: "on-alert", name: "OnAlert", direction: "output", dataType: "event", description: "Emitted when the enemy acquires a target." }],
    },
    composite: {
      ...base,
      category: "composite",
      runtime_kind: "generic",
      properties: [
        { key: "theme", label: "Theme", type: "string", defaultValue: "cabin", description: "Composite theme preset." },
        { key: "autoWire", label: "Auto Wire", type: "boolean", defaultValue: true, description: "Automatically connect child bricks after placement." },
      ],
      slots: [{ slotId: "demo-scene", label: "Demo Scene", optional: true, fallbackAssetRef: "asset://scene/default-composite-demo" }],
      ports: [{ id: "on-ready", name: "OnReady", direction: "output", dataType: "event", description: "Emitted when the composite setup is ready." }],
      composite_children: [
        { id: "trigger-entry", type: "trigger-zone", position: [-1.2, 0, 1.4] },
        { id: "door-main", type: "door", position: [1.2, 0, 1.4] },
      ],
      composite_edges: [{ from: "trigger-entry", to: "door-main" }],
      composite_param_groups: [
        {
          key: "entrance",
          label: "Entrance Setup",
          values: {
            theme: "cabin",
            autoWire: true,
          },
        },
      ],
      dependencies: ["user.basketball-ability@>=0.1.0"],
      granted_ability_packages: ["user.basketball-ability"],
    },
    "ability-set": {
      ...base,
      category: "ability",
      runtime_kind: "generic",
      supported_actor_types: ["humanoid"],
      properties: [
        { key: "abilityId", label: "Ability Id", type: "string", defaultValue: "basketball_basic", description: "Ability set identifier." },
        { key: "requiresInputMap", label: "Requires Input Map", type: "boolean", defaultValue: true, description: "Whether a dedicated input map is required." },
      ],
      slots: [
        { slotId: "anim-pack", label: "Animation Pack", optional: true, fallbackAssetRef: "asset://anim/default-ability-pack" },
        { slotId: "input-map", label: "Input Map", optional: true, fallbackAssetRef: "asset://input/default-ability-map" },
      ],
      ports: [{ id: "on-granted", name: "OnGranted", direction: "output", dataType: "event", description: "Emitted when the ability set is granted." }],
    },
  };

  return JSON.stringify(byTemplate[draft.template], null, 2);
};

const createAuthoringArtifactPayload = (manifestJson: string, packageId: string, version: string): string =>
  JSON.stringify(
    {
      artifact: {
        format: "fateblock-json",
        package: packageId,
        version,
        checksum: `sha256:${packageId.replace(/[^a-z0-9]+/gi, "").toLowerCase()}${version.replace(/\./g, "")}`,
      },
      manifest: JSON.parse(manifestJson) as unknown,
    },
    null,
    2,
  );

const downloadAuthoringManifest = (json: string, packageId: string, version: string): void => {
  const artifactJson = createAuthoringArtifactPayload(json, packageId, version);
  const blob = new Blob([artifactJson], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${packageId.replace(/[^a-z0-9._-]+/gi, "-")}-${version}.fateblock`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const normalizeBrickSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function BrickLibraryPanel(props: BrickLibraryPanelProps): JSX.Element {
  const { t } = useI18n();
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [expandedCompositeIds, setExpandedCompositeIds] = useState<string[]>([]);
  const [showImportForm, setShowImportForm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [showAuthoringWizard, setShowAuthoringWizard] = useState(false);
  const [importDraft, setImportDraft] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [authoringDraft, setAuthoringDraft] = useState<BrickAuthoringDraft>({
    template: "door",
    id: "new-door",
    name: "New Door",
    packageId: "user.new-door",
    version: "0.1.0",
    summary: "A newly authored brick package.",
    category: "custom",
    license: "Custom",
  });
  const [sourceFilter, setSourceFilter] = useState<"all" | "builtin" | "imported">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "incomplete" | "blocked">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const preview = useMemo(() => props.onPreviewBrick(importDraft), [importDraft, props]);
  const availableCategories = useMemo(
    () => [...new Set(props.items.map((item) => item.category).filter((value) => value.trim().length > 0))].sort((left, right) => left.localeCompare(right)),
    [props.items],
  );
  const authoringIssues = useMemo(() => {
    const issues: string[] = [];
    if (authoringDraft.id.trim().length === 0) {
      issues.push(t("panel.brickLibrary.wizardIssueId"));
    }
    if (authoringDraft.name.trim().length === 0) {
      issues.push(t("panel.brickLibrary.wizardIssueName"));
    }
    if (authoringDraft.packageId.trim().length === 0) {
      issues.push(t("panel.brickLibrary.wizardIssuePackageId"));
    }
    return issues;
  }, [authoringDraft, t]);
  const authoringChecks = useMemo<BrickAuthoringCheckItem[]>(() => {
    const generated = JSON.parse(createAuthoringTemplateManifest(authoringDraft)) as Record<string, unknown>;
    const properties = Array.isArray(generated.properties) ? generated.properties.length : 0;
    const slots = Array.isArray(generated.slots) ? generated.slots.length : 0;
    const ports = Array.isArray(generated.ports) ? generated.ports.length : 0;
    const slotNames = Array.isArray(generated.slots)
      ? generated.slots
          .map((slot) => (typeof slot === "object" && slot !== null && "slotId" in slot && typeof (slot as { slotId: unknown }).slotId === "string" ? (slot as { slotId: string }).slotId : null))
          .filter((slotId): slotId is string => slotId !== null)
      : [];
    return [
      {
        category: t("panel.brickLibrary.checkMetadata"),
        status: authoringIssues.length === 0 ? "ready" : "warning",
        detail:
          authoringIssues.length === 0
            ? t("panel.brickLibrary.checkMetadataReady", { packageId: authoringDraft.packageId, version: authoringDraft.version })
            : authoringIssues.join(" "),
      },
      {
        category: t("panel.brickLibrary.checkParameters"),
        status: properties > 0 ? "ready" : "warning",
        detail: t("panel.brickLibrary.checkParametersDetail", { count: String(properties) }),
      },
      {
        category: t("panel.brickLibrary.checkResources"),
        status: slots > 0 ? "ready" : "warning",
        detail: t("panel.brickLibrary.checkResourcesDetail", { count: String(slots), slots: slotNames.join(", ") || "n/a" }),
      },
      {
        category: t("panel.brickLibrary.checkPorts"),
        status: ports > 0 ? "ready" : "warning",
        detail: t("panel.brickLibrary.checkPortsDetail", { count: String(ports) }),
      },
    ];
  }, [authoringDraft, authoringIssues, t]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return props.items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [item.id, item.name, item.summary, item.packageId, item.category].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesSource = sourceFilter === "all" || item.source === sourceFilter;
      const matchesStatus = statusFilter === "all" || item.installState === statusFilter;
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesQuery && matchesSource && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, props.items, query, sourceFilter, statusFilter]);
  const recentItems = useMemo(() => {
    const recentSet = new Set(props.recentIds);
    return props.recentIds
      .map((id) => filteredItems.find((item) => item.id === id))
      .filter((item): item is BrickLibraryItem => item !== undefined && recentSet.has(item.id))
      .slice(0, 6);
  }, [filteredItems, props.recentIds]);
  const recommendedItems = useMemo(
    () =>
      props.recommendedIds
        .map((id) => filteredItems.find((item) => item.id === id))
        .filter((item): item is BrickLibraryItem => item !== undefined && !recentItems.some((recent) => recent.id === item.id))
        .slice(0, 6),
    [filteredItems, props.recommendedIds, recentItems],
  );
  const regularItems = useMemo(
    () => filteredItems.filter((item) => !recentItems.some((recent) => recent.id === item.id) && !recommendedItems.some((recommended) => recommended.id === item.id)),
    [filteredItems, recentItems, recommendedItems],
  );

  const onSubmitImport = (): void => {
    if (preview.item === null) {
      setImportMessage(t("import.brick.invalid"));
      return;
    }
    setShowImportConfirm(true);
  };

  const onConfirmImport = (): void => {
    const result = props.onImportBrick(importDraft);
    setImportMessage(result.message);
    if (result.ok) {
      setImportDraft("");
      setShowImportForm(false);
      setShowImportConfirm(false);
    }
  };

  const onImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }
    try {
      const text = await file.text();
      setImportDraft(text);
      setShowImportForm(true);
      setShowImportConfirm(false);
      setImportMessage(t("panel.brickLibrary.fileLoaded", { fileName: file.name }));
    } catch {
      setImportMessage(t("panel.brickLibrary.fileLoadFailed", { fileName: file.name }));
    } finally {
      event.target.value = "";
    }
  };

  const onTemplateChange = (template: BrickAuthoringTemplate): void => {
    const labelByTemplate: Record<BrickAuthoringTemplate, string> = {
      door: "Door",
      switch: "Switch",
      "trigger-zone": "Trigger Zone",
      ladder: "Ladder",
      enemy: "Enemy",
      composite: "Composite",
      "ability-set": "Ability Set",
    };
    const presetByTemplate: Partial<Record<BrickAuthoringTemplate, Pick<BrickAuthoringDraft, "id" | "name" | "packageId" | "summary" | "category">>> = {
      enemy: {
        id: "patrol-guard",
        name: "Patrol Guard",
        packageId: "user.patrol-guard",
        summary: "A reusable enemy template with patrol and melee defaults.",
        category: "enemy",
      },
      composite: {
        id: "basketball-court",
        name: "Basketball Court",
        packageId: "user.basketball-court",
        summary: "A composite court area that grants basketball abilities inside the zone.",
        category: "composite",
      },
      "ability-set": {
        id: "basketball-ability",
        name: "Basketball Ability Set",
        packageId: "user.basketball-ability",
        summary: "A starter ability set that grants dribble and shoot interactions.",
        category: "ability",
      },
    };
    const preset = presetByTemplate[template];
    setAuthoringDraft((prev) => ({
      ...prev,
      template,
      id: preset !== undefined ? preset.id : prev.id === "" || prev.id.startsWith("new-") ? `new-${template}` : prev.id,
      name: preset !== undefined ? preset.name : prev.name === "" || prev.name.startsWith("New ") ? `New ${labelByTemplate[template]}` : prev.name,
      packageId: preset !== undefined ? preset.packageId : prev.packageId === "" || prev.packageId.startsWith("user.new-") ? `user.new-${template}` : prev.packageId,
      category: preset?.category ?? (template === "ability-set" ? "ability" : template === "composite" ? "composite" : template === "enemy" ? "enemy" : "custom"),
      summary:
        preset?.summary ??
        (prev.summary === "A newly authored brick package."
          ? `A newly authored ${labelByTemplate[template]} brick package.`
          : prev.summary),
    }));
  };

  const onGenerateAuthoringDraft = (): void => {
    if (authoringIssues.length > 0) {
      setImportMessage(authoringIssues[0] ?? t("import.brick.invalid"));
      return;
    }
    const manifestJson = createAuthoringTemplateManifest(authoringDraft);
    setImportDraft(manifestJson);
    setShowImportForm(true);
    setShowImportConfirm(true);
    setShowAuthoringWizard(false);
    setImportMessage(t("panel.brickLibrary.wizardGenerated", { brickName: authoringDraft.name }));
  };

  const onPackageAuthoringDraft = (): void => {
    if (authoringIssues.length > 0) {
      setImportMessage(authoringIssues[0] ?? t("import.brick.invalid"));
      return;
    }
    const manifestJson = createAuthoringTemplateManifest(authoringDraft);
    downloadAuthoringManifest(manifestJson, authoringDraft.packageId, authoringDraft.version);
    setImportDraft(manifestJson);
    setShowImportForm(true);
    setImportMessage(t("panel.brickLibrary.packageGenerated", { brickName: authoringDraft.name }));
  };

  const onAutofillAuthoringDraft = (): void => {
    setAuthoringDraft((prev) => {
      const normalizedName = prev.name.trim().length > 0 ? prev.name : `New ${prev.template}`;
      const slug = normalizeBrickSlug(prev.id) || normalizeBrickSlug(normalizedName) || `new-${prev.template}`;
      return {
        ...prev,
        id: prev.id.trim().length > 0 ? normalizeBrickSlug(prev.id) : slug,
        name: normalizedName,
        packageId: prev.packageId.trim().length > 0 ? prev.packageId : `user.${slug}`,
        version: prev.version.trim().length > 0 ? prev.version : "0.1.0",
        summary: prev.summary.trim().length > 0 ? prev.summary : `A newly authored ${prev.template} brick package.`,
        category: prev.category.trim().length > 0 ? prev.category : prev.template === "ability-set" ? "ability" : prev.template === "composite" ? "composite" : prev.template === "enemy" ? "enemy" : "custom",
        license: prev.license.trim().length > 0 ? prev.license : "Custom",
      };
    });
    setImportMessage(t("panel.brickLibrary.wizardAutofilled"));
  };

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <div>
          <h2 style={panelTitleStyle}>{t("panel.brickLibrary.title")}</h2>
          <div style={{ fontSize: "12px", color: "#5b697d", marginTop: "4px" }}>
            {t("panel.brickLibrary.summary", { count: String(props.items.length) })}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <details style={{ position: "relative" }}>
            <summary style={{ listStyle: "none", cursor: "pointer", padding: "6px 10px", borderRadius: "8px", border: "1px solid #d5dde7", background: "#ffffff", color: "#314357", fontSize: "12px", fontWeight: 700 }}>
              文件
            </summary>
            <div role="menu" style={{ ...actionMenuPanelStyle, right: 0 }}>
              <div role="menuitem" tabIndex={0} style={actionMenuItemStyle} onClick={() => { setShowImportForm((prev) => !prev); setImportMessage(""); setShowImportConfirm(false); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setShowImportForm((prev) => !prev); setImportMessage(""); setShowImportConfirm(false); } }}>
                {t("panel.brickLibrary.import")}
              </div>
              <div role="menuitem" tabIndex={0} style={actionMenuItemStyle} onClick={() => importFileInputRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); importFileInputRef.current?.click(); } }}>
                {t("panel.brickLibrary.importFile")}
              </div>
              <div role="menuitem" tabIndex={0} style={actionMenuItemStyle} onClick={props.onExportLockfile} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); props.onExportLockfile(); } }}>
                {t("panel.brickLibrary.exportLockfile")}
              </div>
            </div>
          </details>
          <details style={{ position: "relative" }}>
            <summary style={{ listStyle: "none", cursor: "pointer", padding: "6px 10px", borderRadius: "8px", border: "1px solid #d5dde7", background: "#ffffff", color: "#314357", fontSize: "12px", fontWeight: 700 }}>
              创建
            </summary>
            <div role="menu" style={{ ...actionMenuPanelStyle, right: 0 }}>
              <div role="menuitem" tabIndex={0} style={actionMenuItemStyle} onClick={() => { setShowAuthoringWizard((prev) => !prev); setImportMessage(""); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setShowAuthoringWizard((prev) => !prev); setImportMessage(""); } }}>
                {t("panel.brickLibrary.newBrick")}
              </div>
            </div>
          </details>
        </div>
      </div>
      <input ref={importFileInputRef} type="file" accept=".json,.lock,.fateblock,.brick" onChange={onImportFileChange} style={{ display: "none" }} />

      {showAuthoringWizard ? (
        <div style={{ display: "grid", gap: "8px", padding: "10px", borderRadius: "12px", background: "#f4f8ff", border: "1px solid #c4d2e4" }}>
          <strong style={{ fontSize: "13px", color: "#203249" }}>{t("panel.brickLibrary.wizardTitle")}</strong>
          <div style={{ fontSize: "12px", color: "#48576a" }}>{t("panel.brickLibrary.wizardHint")}</div>
          <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "#203249" }}>
            {t("panel.brickLibrary.wizardTemplate")}
            <select value={authoringDraft.template} onChange={(event) => onTemplateChange(event.target.value as BrickAuthoringTemplate)}>
              <option value="door">{t("panel.brickLibrary.templateDoor")}</option>
              <option value="switch">{t("panel.brickLibrary.templateSwitch")}</option>
              <option value="trigger-zone">{t("panel.brickLibrary.templateTriggerZone")}</option>
              <option value="ladder">{t("panel.brickLibrary.templateLadder")}</option>
              <option value="enemy">{t("panel.brickLibrary.templateEnemy")}</option>
              <option value="composite">{t("panel.brickLibrary.templateComposite")}</option>
              <option value="ability-set">{t("panel.brickLibrary.templateAbilitySet")}</option>
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            {[
              ["id", t("panel.brickLibrary.wizardId"), authoringDraft.id],
              ["name", t("panel.brickLibrary.wizardName"), authoringDraft.name],
              ["packageId", t("panel.brickLibrary.wizardPackageId"), authoringDraft.packageId],
              ["version", t("panel.brickLibrary.wizardVersion"), authoringDraft.version],
              ["category", t("panel.brickLibrary.wizardCategory"), authoringDraft.category],
              ["license", t("panel.brickLibrary.wizardLicense"), authoringDraft.license],
            ].map(([key, label, value]) => (
              <label key={key} style={{ display: "grid", gap: "4px", fontSize: "12px", color: "#203249" }}>
                {label}
                <input
                  type="text"
                  value={value}
                  onChange={(event) => setAuthoringDraft((prev) => ({ ...prev, [key]: event.target.value }))}
                  style={{ borderRadius: "8px", border: "1px solid #b8c5d8", padding: "8px 10px" }}
                />
              </label>
            ))}
          </div>
          <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "#203249" }}>
            {t("panel.brickLibrary.wizardSummary")}
            <textarea
              rows={3}
              value={authoringDraft.summary}
              onChange={(event) => setAuthoringDraft((prev) => ({ ...prev, summary: event.target.value }))}
              style={{ borderRadius: "8px", border: "1px solid #b8c5d8", padding: "8px 10px", resize: "vertical" }}
            />
          </label>
          <div style={{ fontSize: "12px", color: "#405066" }}>
            {t("panel.brickLibrary.wizardPreview", { template: authoringDraft.template, packageId: authoringDraft.packageId })}
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <strong style={{ fontSize: "12px", color: "#203249" }}>{t("panel.brickLibrary.checkPanelTitle")}</strong>
            {authoringChecks.map((item) => (
              <div
                key={`${item.category}-${item.detail}`}
                style={{
                  display: "grid",
                  gap: "4px",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  border: "1px solid #d5deea",
                  background: item.status === "ready" ? "#f4fbf1" : "#fff7e8",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <strong style={{ fontSize: "12px", color: "#203249" }}>{item.category}</strong>
                  <span style={{ fontSize: "11px", color: item.status === "ready" ? "#2d6b2f" : "#7d5400" }}>
                    {item.status === "ready" ? t("panel.brickLibrary.checkReady") : t("panel.brickLibrary.checkWarning")}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#405066" }}>{item.detail}</div>
              </div>
            ))}
          </div>
          {authoringIssues.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#7d5400" }}>
              {authoringIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: "12px", color: "#405066" }}>{t("panel.brickLibrary.wizardReady")}</div>
          )}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onGenerateAuthoringDraft}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #2553a4", background: "#1c4e9a", color: "#fff" }}
            >
              {t("panel.brickLibrary.wizardGenerate")}
            </button>
            <button
              type="button"
              onClick={onAutofillAuthoringDraft}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}
            >
              {t("panel.brickLibrary.wizardAutofill")}
            </button>
            <button
              type="button"
              onClick={onPackageAuthoringDraft}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #2f6f47", background: "#eef9f1", color: "#245638" }}
            >
            {t("panel.brickLibrary.packageGenerate")}
          </button>
            <button
              type="button"
              onClick={() => setShowAuthoringWizard(false)}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}
            >
              {t("panel.brickLibrary.importCancel")}
            </button>
          </div>
        </div>
      ) : null}

      <input
        type="text"
        value={query}
        placeholder={t("panel.brickLibrary.searchPlaceholder")}
        onChange={(event) => setQuery(event.target.value)}
        style={{ width: "100%", boxSizing: "border-box", borderRadius: "10px", border: "1px solid #b8c5d8", padding: "10px 12px" }}
      />

      <div style={{ display: "grid", gap: "8px", padding: "10px", borderRadius: "12px", background: "#f7f9fc", border: "1px solid #d5deea" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#203249" }}>{t("panel.brickLibrary.samplesTitle")}</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => props.onOpenSample("forest-cabin")}
            style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}
          >
            {t("panel.brickLibrary.sampleForestCabin")}
          </button>
          <button
            type="button"
            onClick={() => props.onOpenSample("basketball-court")}
            style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}
          >
            {t("panel.brickLibrary.sampleBasketballCourt")}
          </button>
          <button
            type="button"
            onClick={() => props.onOpenSample("patrol-guard")}
            style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}
          >
            {t("panel.brickLibrary.samplePatrolGuard")}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            setSourceFilter("all");
            setStatusFilter("all");
            setCategoryFilter("all");
          }}
          style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: sourceFilter === "all" && statusFilter === "all" && categoryFilter === "all" ? "#dfeeff" : "#fff", color: "#23405f" }}
        >
          {t("panel.brickLibrary.filterAll")}
        </button>
        <button type="button" onClick={() => setSourceFilter("builtin")} style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: sourceFilter === "builtin" ? "#dfeeff" : "#fff", color: "#23405f" }}>
          {t("panel.brickLibrary.sourceBuiltin")}
        </button>
        <button type="button" onClick={() => setSourceFilter("imported")} style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: sourceFilter === "imported" ? "#dfeeff" : "#fff", color: "#23405f" }}>
          {t("panel.brickLibrary.sourceImported")}
        </button>
        <button type="button" onClick={() => setStatusFilter("ready")} style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: statusFilter === "ready" ? "#e7f8e6" : "#fff", color: "#23405f" }}>
          {t("panel.brickLibrary.statusReady")}
        </button>
        <button type="button" onClick={() => setStatusFilter("incomplete")} style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: statusFilter === "incomplete" ? "#fff3d9" : "#fff", color: "#23405f" }}>
          {t("panel.brickLibrary.statusIncomplete")}
        </button>
        <button type="button" onClick={() => setStatusFilter("blocked")} style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: statusFilter === "blocked" ? "#ffe3de" : "#fff", color: "#23405f" }}>
          {t("panel.brickLibrary.statusBlocked")}
        </button>
      </div>

      <div style={{ display: "grid", gap: "6px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#203249" }}>{t("panel.brickLibrary.categoryFilterTitle")}</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: categoryFilter === "all" ? "#dfeeff" : "#fff", color: "#23405f" }}
          >
            {t("panel.brickLibrary.filterAll")}
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #c5d2e2", background: categoryFilter === category ? "#dfeeff" : "#fff", color: "#23405f" }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {showImportForm ? (
        <div style={{ display: "grid", gap: "8px", padding: "10px", borderRadius: "12px", background: "#eef4fb", border: "1px solid #c4d2e4" }}>
          <div style={{ fontSize: "12px", color: "#48576a" }}>{t("panel.brickLibrary.importHint")}</div>
          <textarea
            value={importDraft}
            onChange={(event) => setImportDraft(event.target.value)}
            placeholder={t("panel.brickLibrary.importPlaceholder")}
            rows={8}
            style={{ width: "100%", boxSizing: "border-box", borderRadius: "10px", border: "1px solid #b8c5d8", padding: "10px 12px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
          />
          {importDraft.trim().length > 0 ? (
            <div style={{ padding: "10px", borderRadius: "10px", background: "#fff", border: "1px solid #d5deea", display: "grid", gap: "6px" }}>
              <strong style={{ fontSize: "12px", color: "#203249" }}>{t("panel.brickLibrary.previewTitle")}</strong>
              {preview.item === null ? (
                <div style={{ fontSize: "12px", color: "#7d5400" }}>{preview.issues[0] ?? t("import.brick.invalid")}</div>
              ) : (
                <>
                  <div style={{ fontSize: "12px", color: "#405066" }}>
                    {preview.item.name} / {preview.item.packageId}@{preview.item.version}
                  </div>
                  <div style={{ fontSize: "12px", color: "#405066" }}>
                    {t("panel.brickLibrary.previewSourceType", { sourceType: preview.sourceType })}
                  </div>
                  <div style={{ fontSize: "12px", color: "#405066" }}>
                    {t("panel.brickLibrary.previewMeta", {
                      license: preview.item.license,
                      compat: preview.item.compat,
                      dependencyCount: String(preview.item.dependencies.length),
                    })}
                  </div>
                  <div style={{ fontSize: "12px", color: "#405066" }}>
                    {t("panel.brickLibrary.previewContract")}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: preview.issues.length > 0 ? "#7d5400" : "#405066" }}>
                    {(preview.issues.length > 0 ? preview.issues : [t("panel.brickDetails.readyMessage")]).map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button type="button" onClick={onSubmitImport} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #2553a4", background: "#1c4e9a", color: "#fff" }}>
              {t("panel.brickLibrary.importReview")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowImportForm(false);
                setShowImportConfirm(false);
              }}
              style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}
            >
              {t("panel.brickLibrary.importCancel")}
            </button>
          </div>
          {importMessage.length > 0 ? <div style={{ fontSize: "12px", color: "#48576a" }}>{importMessage}</div> : null}
          {showImportConfirm && preview.item !== null ? (
            <div style={{ display: "grid", gap: "8px", padding: "10px", borderRadius: "10px", background: "#fff", border: "1px solid #b8c5d8" }}>
              <strong style={{ fontSize: "12px", color: "#203249" }}>{t("panel.brickLibrary.confirmTitle")}</strong>
              <div style={{ fontSize: "12px", color: "#405066" }}>
                {preview.item.name} / {preview.item.packageId}@{preview.item.version}
              </div>
              <div style={{ fontSize: "12px", color: "#405066" }}>
                {t("panel.brickLibrary.previewSourceType", { sourceType: preview.sourceType })}
              </div>
              <div style={{ fontSize: "12px", color: "#405066" }}>
                {t("panel.brickLibrary.previewMeta", {
                  license: preview.item.license,
                  compat: preview.item.compat,
                  dependencyCount: String(preview.item.dependencies.length),
                })}
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: preview.issues.length > 0 ? "#7d5400" : "#405066" }}>
                {(preview.issues.length > 0 ? preview.issues : [t("panel.brickLibrary.confirmReady")]).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={onConfirmImport} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #2553a4", background: "#1c4e9a", color: "#fff" }}>
                  {t("panel.brickLibrary.confirmInstall")}
                </button>
                <button type="button" onClick={() => setShowImportConfirm(false)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}>
                  {t("panel.brickLibrary.confirmBack")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "10px", maxHeight: "380px", overflow: "auto", paddingRight: "4px" }}>
        {recentItems.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#203249" }}>{t("panel.brickLibrary.recentTitle")}</div>
            {recentItems.map((item) =>
              renderBrickCard(
                item,
                item.id === props.selectedId,
                props.highlightedIds?.includes(item.id) ?? false,
                t,
                [
                  <button key="inspect" type="button" onClick={() => props.onSelect(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}>
                    {t("panel.brickLibrary.inspect")}
                  </button>,
                  <button key="add" type="button" onClick={() => props.onAddToScene(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #2553a4", background: "#1c4e9a", color: "#fff" }}>
                    {t("panel.brickLibrary.addToScene")}
                  </button>,
                  <button key="preview" type="button" onClick={() => props.onQuickPreview(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b6c6e6", background: "#f5f8ff", color: "#21416d" }}>
                    {t("panel.brickLibrary.quickPreview")}
                  </button>,
                ],
                expandedCompositeIds,
                setExpandedCompositeIds,
                props.onSelect,
                props.onRemoveBrick,
                props.onRollbackBrick,
                setImportMessage,
              ),
            )}
          </div>
        ) : null}
        {recommendedItems.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#203249" }}>{t("panel.brickLibrary.recommendedTitle")}</div>
            {recommendedItems.map((item) =>
              renderBrickCard(
                item,
                item.id === props.selectedId,
                props.highlightedIds?.includes(item.id) ?? false,
                t,
                [
                  <button key="inspect" type="button" onClick={() => props.onSelect(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}>
                    {t("panel.brickLibrary.inspect")}
                  </button>,
                  <button key="add" type="button" onClick={() => props.onAddToScene(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #2553a4", background: "#1c4e9a", color: "#fff" }}>
                    {t("panel.brickLibrary.addToScene")}
                  </button>,
                  <button key="preview" type="button" onClick={() => props.onQuickPreview(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b6c6e6", background: "#f5f8ff", color: "#21416d" }}>
                    {t("panel.brickLibrary.quickPreview")}
                  </button>,
                ],
                expandedCompositeIds,
                setExpandedCompositeIds,
                props.onSelect,
                props.onRemoveBrick,
                props.onRollbackBrick,
                setImportMessage,
              ),
            )}
          </div>
        ) : null}
        {regularItems.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {recentItems.length > 0 || recommendedItems.length > 0 ? <div style={{ fontSize: "12px", fontWeight: 700, color: "#203249" }}>{t("panel.brickLibrary.allResultsTitle")}</div> : null}
            {regularItems.map((item) =>
              renderBrickCard(
                item,
                item.id === props.selectedId,
                props.highlightedIds?.includes(item.id) ?? false,
                t,
                [
                  <button key="inspect" type="button" onClick={() => props.onSelect(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b8c5d8", background: "#fff", color: "#1f2e43" }}>
                    {t("panel.brickLibrary.inspect")}
                  </button>,
                  <button key="add" type="button" onClick={() => props.onAddToScene(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #2553a4", background: "#1c4e9a", color: "#fff" }}>
                    {t("panel.brickLibrary.addToScene")}
                  </button>,
                  <button key="preview" type="button" onClick={() => props.onQuickPreview(item.id)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #b6c6e6", background: "#f5f8ff", color: "#21416d" }}>
                    {t("panel.brickLibrary.quickPreview")}
                  </button>,
                ],
                expandedCompositeIds,
                setExpandedCompositeIds,
                props.onSelect,
                props.onRemoveBrick,
                props.onRollbackBrick,
                setImportMessage,
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
