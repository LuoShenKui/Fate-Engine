import type { BrickPort, BrickSlotSchema, BrickWhiteboxMetadata } from "../domain/brick";
import type { BrickTags } from "./brick-tags";
import { formatBrickTags } from "./brick-tags";
import { useI18n } from "./i18n/I18nProvider";

type BrickDetailsPanelProps = {
  name: string;
  summary: string;
  previewSrc?: string;
  readinessSummary?: Array<{ label: string; tone: "ready" | "warning" | "blocked" }>;
  packageId: string;
  version: string;
  license: string;
  dependencies: string[];
  compat: string;
  source: "builtin" | "imported";
  category: string;
  runtimeKind: "door" | "switch" | "ladder" | "trigger-zone" | "enemy" | "generic";
  installState: "ready" | "incomplete" | "blocked";
  importIssues: string[];
  compositeChildCount?: number;
  supportedActorTypes?: string[];
  grantedAbilityPackageIds?: string[];
  activeAbilityNames?: string[];
  enemyBehaviorSummary?: Array<{ label: string; value: string }>;
  actorType?: string;
  abilityEquipped?: boolean;
  onToggleActorAbility?: () => void;
  tags?: BrickTags;
  whiteboxMetadata?: BrickWhiteboxMetadata;
  nodeValidationState?: "ready" | "incomplete" | "blocked";
  nodeValidationIssues?: string[];
  slots: BrickSlotSchema[];
  ports: BrickPort[];
};

const cardStyle = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #2a3543",
  background: "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
} as const;

const formatCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    actor: "Actor",
    ability: "Ability",
    interaction: "Interaction",
    enemy: "Enemy",
    loot: "Loot",
    zone: "Zone",
    "asset-package": "Asset Package",
  };
  return labels[category] ?? category;
};

const validationToneStyle = (state: "ready" | "incomplete" | "blocked"): { background: string; color: string } => {
  if (state === "blocked") return { background: "#ffe3de", color: "#7d2c1f" };
  if (state === "incomplete") return { background: "#fff1cf", color: "#7d5400" };
  return { background: "#ddf5df", color: "#2d6b2f" };
};

const formatValidationLabel = (state: "ready" | "incomplete" | "blocked"): string => {
  if (state === "blocked") return "Blocked";
  if (state === "incomplete") return "Incomplete";
  return "Ready";
};

export default function BrickDetailsPanel(props: BrickDetailsPanelProps): JSX.Element {
  const { t } = useI18n();

  return (
    <section style={{ display: "grid", gap: "10px", color: "#dfe8f2" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#f3f7fb" }}>{t("panel.brickDetails.title")}</h2>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "#9caec2" }}>{t("panel.brickDetails.summary")}</div>
      </div>

      <div style={cardStyle}>
        {typeof props.previewSrc === "string" && props.previewSrc.length > 0 ? (
          <div
            style={{
              minHeight: "140px",
              borderRadius: "10px",
              border: "1px solid #394759",
              backgroundImage: `url("${props.previewSrc}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              marginBottom: "4px",
            }}
          />
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "start" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f3f7fb" }}>{props.name}</div>
            <div style={{ marginTop: "4px", fontSize: "12px", color: "#a9b8c9" }}>{props.summary}</div>
          </div>
          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: props.installState === "ready" ? "#ddf5df" : props.installState === "blocked" ? "#ffe3de" : "#fff1cf", color: props.installState === "blocked" ? "#7d2c1f" : "#5b4300" }}>
            {props.installState === "ready" ? t("panel.brickLibrary.statusReady") : props.installState === "blocked" ? t("panel.brickLibrary.statusBlocked") : t("panel.brickLibrary.statusIncomplete")}
          </span>
        </div>
        {(props.readinessSummary?.length ?? 0) > 0 ? (
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {props.readinessSummary?.map((item) => (
              <span
                key={`${item.label}-${item.tone}`}
                style={{
                  fontSize: "11px",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  background: item.tone === "ready" ? "#ddf5df" : item.tone === "blocked" ? "#ffe3de" : "#fff1cf",
                  color: item.tone === "blocked" ? "#7d2c1f" : item.tone === "ready" ? "#2d6b2f" : "#7d5400",
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", fontSize: "12px", color: "#d8e1ed" }}>
          <div><strong>{t("panel.brickDetails.packageId")}</strong><div>{props.packageId}</div></div>
          <div><strong>{t("panel.brickDetails.version")}</strong><div>{props.version}</div></div>
          <div><strong>{t("panel.brickDetails.license")}</strong><div>{props.license}</div></div>
          <div><strong>{t("panel.brickDetails.compat")}</strong><div>{props.compat}</div></div>
          <div><strong>{t("panel.brickDetails.source")}</strong><div>{props.source === "builtin" ? t("panel.brickLibrary.sourceBuiltin") : t("panel.brickLibrary.sourceImported")}</div></div>
          <div><strong>{t("panel.brickDetails.category")}</strong><div>{formatCategoryLabel(props.category)}</div></div>
          <div><strong>{t("panel.brickDetails.runtimeKind")}</strong><div>{props.runtimeKind}</div></div>
          {props.category === "composite" ? <div><strong>{t("panel.brickDetails.compositeChildren")}</strong><div>{String(props.compositeChildCount ?? 0)}</div></div> : null}
          {props.category === "ability" ? <div><strong>{t("panel.brickDetails.actorTypes")}</strong><div>{(props.supportedActorTypes ?? []).join(", ") || "-"}</div></div> : null}
          {(props.grantedAbilityPackageIds ?? []).length > 0 ? <div><strong>{t("panel.brickDetails.grantedAbilities")}</strong><div>{String(props.grantedAbilityPackageIds?.length ?? 0)}</div></div> : null}
        </div>
      </div>

      <div style={cardStyle}>
        <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.brickDetails.contract")}</strong>
        <div style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#c6d2df" }}>
          <div>{t("panel.brickDetails.slots", { count: String(props.slots.length) })}</div>
          <div>{t("panel.brickDetails.ports", { count: String(props.ports.length) })}</div>
        </div>
        {props.slots.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#c6d2df" }}>
            {props.slots.slice(0, 3).map((slot) => (
              <li key={slot.slotId}>
                {slot.label} ({slot.slotId}) {slot.optional ? t("panel.brickDetails.optional") : t("panel.brickDetails.required")}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div style={cardStyle}>
        <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.brickDetails.dependencies")}</strong>
        {props.dependencies.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#c6d2df" }}>{t("panel.brickDetails.dependenciesEmpty")}</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#c6d2df" }}>
            {props.dependencies.map((dependency) => (
              <li key={dependency}>{dependency}</li>
            ))}
          </ul>
        )}
      </div>

      {(props.tags !== undefined && formatBrickTags(props.tags).length > 0) ? (
        <div style={cardStyle}>
          <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Tags</strong>
          <div style={{ display: "grid", gap: "8px", fontSize: "12px", color: "#c6d2df" }}>
            {formatBrickTags(props.tags).map((group) => (
              <div key={group.label}>
                <strong>{group.label}</strong>
                <div>{group.values.join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {props.whiteboxMetadata !== undefined ? (
        <div style={cardStyle}>
          <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Whitebox</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", fontSize: "12px", color: "#c6d2df" }}>
            <div><strong>Style</strong><div>{props.whiteboxMetadata.style}</div></div>
            <div><strong>Art</strong><div>{props.whiteboxMetadata.artStyle}</div></div>
            <div><strong>Scale</strong><div>{props.whiteboxMetadata.realWorldScale}</div></div>
            <div><strong>Actor Class</strong><div>{props.whiteboxMetadata.actorClass}</div></div>
            <div><strong>Interaction Intent</strong><div>{props.whiteboxMetadata.interactionIntent}</div></div>
            <div><strong>Units</strong><div>{props.whiteboxMetadata.unitSystem}</div></div>
          </div>
          {props.whiteboxMetadata.semanticTags.length > 0 ? <div style={{ fontSize: "12px", color: "#c6d2df" }}>{props.whiteboxMetadata.semanticTags.join(", ")}</div> : null}
          {props.whiteboxMetadata.notes.length > 0 ? <div style={{ fontSize: "12px", color: "#a9b8c9" }}>{props.whiteboxMetadata.notes}</div> : null}
        </div>
      ) : null}

      {props.nodeValidationState !== undefined ? (
        <div style={cardStyle}>
          <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Validation</strong>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#c6d2df" }}>Scene node assembly state</div>
            <span
              style={{
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "999px",
                ...validationToneStyle(props.nodeValidationState),
              }}
            >
              {formatValidationLabel(props.nodeValidationState)}
            </span>
          </div>
          {(props.nodeValidationIssues?.length ?? 0) === 0 ? (
            <div style={{ fontSize: "12px", color: "#c6d2df" }}>No blocking scene validation issues.</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: props.nodeValidationState === "blocked" ? "#ffd0c6" : "#f0d79f" }}>
              {props.nodeValidationIssues?.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {(props.grantedAbilityPackageIds ?? []).length > 0 || props.category === "ability" ? (
        <div style={cardStyle}>
          <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.brickDetails.ability")}</strong>
          <div style={{ display: "grid", gap: "6px", fontSize: "12px", color: "#c6d2df" }}>
            <div>{t("panel.brickDetails.actorType", { actorType: props.actorType ?? "-" })}</div>
            {props.category === "ability" ? <div>{t("panel.brickDetails.supportedActors", { actors: (props.supportedActorTypes ?? []).join(", ") || "-" })}</div> : null}
            {(props.grantedAbilityPackageIds ?? []).length > 0 ? <div>{t("panel.brickDetails.abilityGrants", { count: String(props.grantedAbilityPackageIds?.length ?? 0) })}</div> : null}
            {(props.activeAbilityNames ?? []).length > 0 ? <div>{t("panel.brickDetails.activeAbilities", { abilities: props.activeAbilityNames?.join(", ") ?? "-" })}</div> : null}
          </div>
          {(props.grantedAbilityPackageIds ?? []).length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#c6d2df" }}>
              {props.grantedAbilityPackageIds?.map((abilityPackageId) => (
                <li key={abilityPackageId}>{abilityPackageId}</li>
              ))}
            </ul>
          ) : null}
          {props.category === "ability" && props.onToggleActorAbility !== undefined ? (
            <button
              type="button"
              onClick={props.onToggleActorAbility}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #5378aa", background: props.abilityEquipped ? "#41694c" : "#2d4d74", color: "#fff" }}
            >
              {props.abilityEquipped ? t("panel.brickDetails.revokeAbility") : t("panel.brickDetails.grantAbility")}
            </button>
          ) : null}
        </div>
      ) : null}

      {(props.enemyBehaviorSummary?.length ?? 0) > 0 ? (
        <div style={cardStyle}>
          <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.brickDetails.enemyBehavior")}</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", fontSize: "12px", color: "#c6d2df" }}>
            {props.enemyBehaviorSummary?.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <strong>{item.label}</strong>
                <div>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={cardStyle}>
        <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.brickDetails.readiness")}</strong>
        <div style={{ fontSize: "12px", color: "#8ea3ba" }}>Package install state. Scene validation is shown on placed nodes.</div>
        {props.importIssues.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#c6d2df" }}>{t("panel.brickDetails.readyMessage")}</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#f0d79f" }}>
            {props.importIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
