import type { UnityExportManifest } from "../project/unity-export";
import { useI18n } from "./i18n/I18nProvider";

type UnityExportPanelProps = {
  manifest: UnityExportManifest;
  onExport: () => void;
};

const panelCardStyle = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #2a3543",
  background: "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
} as const;

export default function UnityExportPanel(props: UnityExportPanelProps): JSX.Element {
  const { t } = useI18n();
  const previewJson = JSON.stringify(props.manifest, null, 2);

  return (
    <section style={{ display: "grid", gap: "10px", color: "#dfe8f2" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#f3f7fb" }}>{t("panel.export.title")}</h2>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "#9caec2" }}>{t("panel.export.summary")}</div>
      </div>

      <div style={panelCardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", fontSize: "12px", color: "#c6d2df" }}>
          <div><strong>{t("panel.export.host")}</strong><div>{props.manifest.host}</div></div>
          <div><strong>{t("panel.export.runtime")}</strong><div>{props.manifest.runtime_stack}</div></div>
          <div><strong>{t("panel.export.nodes")}</strong><div>{String(props.manifest.recipe.nodes.length)}</div></div>
          <div><strong>{t("panel.export.bindings")}</strong><div>{String(props.manifest.asset_bindings.length)}</div></div>
          <div><strong>{t("panel.export.generated")}</strong><div>{String(props.manifest.generated_object_map.length)}</div></div>
          <div><strong>{t("panel.export.auditPackages")}</strong><div>{String(props.manifest.audit.packages.length)}</div></div>
        </div>
        <button
          type="button"
          onClick={props.onExport}
          style={{ width: "fit-content", padding: "8px 12px", borderRadius: "8px", border: "1px solid #5378aa", background: "#2d4d74", color: "#fff" }}
        >
          {t("panel.export.download")}
        </button>
      </div>

      <div style={panelCardStyle}>
        <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.export.bindings")}</strong>
        <div style={{ display: "grid", gap: "8px" }}>
          {props.manifest.asset_bindings.map((item) => (
            <div key={item.binding_id} style={{ fontSize: "12px", color: "#c6d2df", border: "1px solid #314051", borderRadius: "8px", padding: "8px" }}>
              <div><strong>{item.slot_id}</strong> {"->"} {item.asset_ref || "<unbound>"}</div>
              <div>{item.resource_type} · {item.unity_target_type} · {item.binding_kind}</div>
              <div>{item.source_package_id}@{item.source_package_version} · {item.source_resource_id}</div>
              {item.issues.length > 0 ? <div style={{ color: "#f1c27d" }}>{item.issues.join(" | ")}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div style={panelCardStyle}>
        <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.export.generatedMap")}</strong>
        <div style={{ display: "grid", gap: "8px" }}>
          {props.manifest.generated_object_map.map((item) => (
            <div key={`${item.node_id}-${item.brick_id}`} style={{ fontSize: "12px", color: "#c6d2df", border: "1px solid #314051", borderRadius: "8px", padding: "8px" }}>
              <div><strong>{item.node_id}</strong> {"->"} {item.brick_id}</div>
              <div>{item.scriptable_object_path}</div>
              <div>{item.prefab_variant_path}</div>
              <div>{item.baker_input}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={panelCardStyle}>
        <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.export.auditTitle")}</strong>
        <div style={{ display: "grid", gap: "8px" }}>
          {props.manifest.audit.packages.map((item) => (
            <div key={`${item.package_id}-${item.version}`} style={{ fontSize: "12px", color: "#c6d2df", border: "1px solid #314051", borderRadius: "8px", padding: "8px" }}>
              <div><strong>{item.package_id}</strong> @{item.version}</div>
              <div>{item.license}</div>
              <div>{item.reason}</div>
              {item.notes.length > 0 ? <div>{item.notes}</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div style={panelCardStyle}>
        <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>{t("panel.export.previewJson")}</strong>
        <pre style={{ margin: 0, fontSize: "11px", lineHeight: 1.45, color: "#c6d2df", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "260px", overflow: "auto" }}>
          {previewJson}
        </pre>
      </div>
    </section>
  );
}
