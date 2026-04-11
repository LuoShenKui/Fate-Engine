import {
  createAuthoringTemplateManifest,
  downloadAuthoringManifest,
  normalizeBrickSlug,
  type BrickAuthoringCheckItem,
  type BrickAuthoringDraft,
  type BrickAuthoringTemplate,
} from "./brick-library-authoring";
import type { BrickImportPreview } from "./brick-library-panel-types";
import type { useI18n } from "./i18n/I18nProvider";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

type BrickLibraryToolsPanelProps = {
  isEnglish: boolean;
  importFileInputRef: React.RefObject<HTMLInputElement | null>;
  showImportForm: boolean;
  setShowImportForm: React.Dispatch<React.SetStateAction<boolean>>;
  showImportConfirm: boolean;
  setShowImportConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  showAuthoringWizard: boolean;
  setShowAuthoringWizard: React.Dispatch<React.SetStateAction<boolean>>;
  importDraft: string;
  setImportDraft: React.Dispatch<React.SetStateAction<string>>;
  importMessage: string;
  setImportMessage: React.Dispatch<React.SetStateAction<string>>;
  authoringDraft: BrickAuthoringDraft;
  setAuthoringDraft: React.Dispatch<React.SetStateAction<BrickAuthoringDraft>>;
  authoringIssues: string[];
  authoringChecks: BrickAuthoringCheckItem[];
  preview: BrickImportPreview;
  t: ReturnType<typeof useI18n>["t"];
  onOpenBlankScene: () => void;
  onOpenSample: (sampleId: "forest-cabin" | "basketball-court" | "patrol-guard") => void;
  onExportLockfile: () => void;
  onSubmitImport: () => void;
  onConfirmImport: () => void;
};

const shellCardStyle = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "10px",
  border: `1px solid ${ueShellColors.border}`,
  background: ueShellColors.panelMuted,
} as const;

export default function BrickLibraryToolsPanel(props: BrickLibraryToolsPanelProps): JSX.Element {
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
      enemy: { id: "patrol-guard", name: "Patrol Guard", packageId: "user.patrol-guard", summary: "A reusable enemy template with patrol and melee defaults.", category: "enemy" },
      composite: { id: "basketball-court", name: "Basketball Court", packageId: "user.basketball-court", summary: "A composite court area that grants basketball abilities inside the zone.", category: "composite" },
      "ability-set": { id: "basketball-ability", name: "Basketball Ability Set", packageId: "user.basketball-ability", summary: "A starter ability set that grants dribble and shoot interactions.", category: "ability" },
    };
    const preset = presetByTemplate[template];
    props.setAuthoringDraft((prev) => ({
      ...prev,
      template,
      id: preset?.id ?? (prev.id === "" || prev.id.startsWith("new-") ? `new-${template}` : prev.id),
      name: preset?.name ?? (prev.name === "" || prev.name.startsWith("New ") ? `New ${labelByTemplate[template]}` : prev.name),
      packageId: preset?.packageId ?? (prev.packageId === "" || prev.packageId.startsWith("user.new-") ? `user.new-${template}` : prev.packageId),
      category: preset?.category ?? (template === "ability-set" ? "ability" : template === "composite" ? "composite" : template === "enemy" ? "enemy" : "custom"),
      summary: preset?.summary ?? (prev.summary === "A newly authored brick package." ? `A newly authored ${labelByTemplate[template]} brick package.` : prev.summary),
    }));
  };

  const onGenerateAuthoringDraft = (): void => {
    if (props.authoringIssues.length > 0) {
      props.setImportMessage(props.authoringIssues[0] ?? props.t("import.brick.invalid"));
      return;
    }
    props.setImportDraft(createAuthoringTemplateManifest(props.authoringDraft));
    props.setShowImportForm(true);
    props.setShowImportConfirm(true);
    props.setShowAuthoringWizard(false);
    props.setImportMessage(props.t("panel.brickLibrary.wizardGenerated", { brickName: props.authoringDraft.name }));
  };

  const onPackageAuthoringDraft = (): void => {
    if (props.authoringIssues.length > 0) {
      props.setImportMessage(props.authoringIssues[0] ?? props.t("import.brick.invalid"));
      return;
    }
    const manifestJson = createAuthoringTemplateManifest(props.authoringDraft);
    downloadAuthoringManifest(manifestJson, props.authoringDraft.packageId, props.authoringDraft.version);
    props.setImportDraft(manifestJson);
    props.setShowImportForm(true);
    props.setImportMessage(props.t("panel.brickLibrary.packageGenerated", { brickName: props.authoringDraft.name }));
  };

  const onAutofillAuthoringDraft = (): void => {
    props.setAuthoringDraft((prev) => {
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
    props.setImportMessage(props.t("panel.brickLibrary.wizardAutofilled"));
  };

  return (
    <div style={{ ...shellCardStyle, background: "#18212c", gap: "10px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" onClick={props.onOpenBlankScene} style={ueGhostButton}>{props.isEnglish ? "Blank Scene" : "空白场景"}</button>
        <button type="button" onClick={() => { props.setShowImportForm((prev) => !prev); props.setShowImportConfirm(false); props.setImportMessage(""); }} style={ueGhostButton}>{props.t("panel.brickLibrary.import")}</button>
        <button type="button" onClick={() => props.importFileInputRef.current?.click()} style={ueGhostButton}>{props.t("panel.brickLibrary.importFile")}</button>
        <button type="button" onClick={props.onExportLockfile} style={ueGhostButton}>{props.t("panel.brickLibrary.exportLockfile")}</button>
        <button type="button" onClick={() => { props.setShowAuthoringWizard((prev) => !prev); props.setImportMessage(""); }} style={ueGhostButton}>{props.t("panel.brickLibrary.newBrick")}</button>
      </div>

      <details>
        <summary style={{ cursor: "pointer", fontSize: "12px", color: ueShellColors.textMuted, fontWeight: 700 }}>{props.t("panel.brickLibrary.samplesTitle")}</summary>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
          <button type="button" onClick={() => props.onOpenSample("forest-cabin")} style={ueGhostButton}>{props.t("panel.brickLibrary.sampleForestCabin")}</button>
          <button type="button" onClick={() => props.onOpenSample("basketball-court")} style={ueGhostButton}>{props.t("panel.brickLibrary.sampleBasketballCourt")}</button>
          <button type="button" onClick={() => props.onOpenSample("patrol-guard")} style={ueGhostButton}>{props.t("panel.brickLibrary.samplePatrolGuard")}</button>
        </div>
      </details>

      {props.showAuthoringWizard ? (
        <div style={{ display: "grid", gap: "10px", paddingTop: "4px" }}>
          <strong style={{ fontSize: "13px", color: ueShellColors.text }}>{props.t("panel.brickLibrary.wizardTitle")}</strong>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.wizardHint")}</div>
          <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: ueShellColors.text }}>
            {props.t("panel.brickLibrary.wizardTemplate")}
            <select value={props.authoringDraft.template} onChange={(event) => onTemplateChange(event.target.value as BrickAuthoringTemplate)} style={{ ...ueGhostButton, padding: "8px 10px" }}>
              <option value="door">{props.t("panel.brickLibrary.templateDoor")}</option>
              <option value="switch">{props.t("panel.brickLibrary.templateSwitch")}</option>
              <option value="trigger-zone">{props.t("panel.brickLibrary.templateTriggerZone")}</option>
              <option value="ladder">{props.t("panel.brickLibrary.templateLadder")}</option>
              <option value="enemy">{props.t("panel.brickLibrary.templateEnemy")}</option>
              <option value="composite">{props.t("panel.brickLibrary.templateComposite")}</option>
              <option value="ability-set">{props.t("panel.brickLibrary.templateAbilitySet")}</option>
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
            {[
              ["id", props.t("panel.brickLibrary.wizardId"), props.authoringDraft.id],
              ["name", props.t("panel.brickLibrary.wizardName"), props.authoringDraft.name],
              ["packageId", props.t("panel.brickLibrary.wizardPackageId"), props.authoringDraft.packageId],
              ["version", props.t("panel.brickLibrary.wizardVersion"), props.authoringDraft.version],
              ["category", props.t("panel.brickLibrary.wizardCategory"), props.authoringDraft.category],
              ["license", props.t("panel.brickLibrary.wizardLicense"), props.authoringDraft.license],
            ].map(([key, label, value]) => (
              <label key={key} style={{ display: "grid", gap: "4px", fontSize: "12px", color: ueShellColors.text }}>
                {label}
                <input type="text" value={value} onChange={(event) => props.setAuthoringDraft((prev) => ({ ...prev, [key]: event.target.value }))} style={{ ...ueGhostButton, padding: "8px 10px" }} />
              </label>
            ))}
          </div>
          <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: ueShellColors.text }}>
            {props.t("panel.brickLibrary.wizardSummary")}
            <textarea rows={3} value={props.authoringDraft.summary} onChange={(event) => props.setAuthoringDraft((prev) => ({ ...prev, summary: event.target.value }))} style={{ ...ueGhostButton, padding: "8px 10px", resize: "vertical" }} />
          </label>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.wizardPreview", { template: props.authoringDraft.template, packageId: props.authoringDraft.packageId })}</div>
          <div style={{ display: "grid", gap: "6px" }}>
            <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{props.t("panel.brickLibrary.checkPanelTitle")}</strong>
            {props.authoringChecks.map((item) => (
              <div key={`${item.category}-${item.detail}`} style={{ display: "grid", gap: "4px", padding: "8px 10px", borderRadius: "10px", border: `1px solid ${ueShellColors.border}`, background: item.status === "ready" ? "#1d3222" : "#342b1d" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
                  <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{item.category}</strong>
                  <span style={{ fontSize: "11px", color: item.status === "ready" ? "#bde0c1" : "#f3d28b" }}>{item.status === "ready" ? props.t("panel.brickLibrary.checkReady") : props.t("panel.brickLibrary.checkWarning")}</span>
                </div>
                <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{item.detail}</div>
              </div>
            ))}
          </div>
          {props.authoringIssues.length > 0 ? <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#f3d28b" }}>{props.authoringIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.wizardReady")}</div>}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={onGenerateAuthoringDraft} style={{ ...ueGhostButton, padding: "8px 12px", background: ueShellColors.accent, borderColor: ueShellColors.accent, color: "#11161d" }}>{props.t("panel.brickLibrary.wizardGenerate")}</button>
            <button type="button" onClick={onAutofillAuthoringDraft} style={{ ...ueGhostButton, padding: "8px 12px" }}>{props.t("panel.brickLibrary.wizardAutofill")}</button>
            <button type="button" onClick={onPackageAuthoringDraft} style={{ ...ueGhostButton, padding: "8px 12px" }}>{props.t("panel.brickLibrary.packageGenerate")}</button>
            <button type="button" onClick={() => props.setShowAuthoringWizard(false)} style={{ ...ueGhostButton, padding: "8px 12px" }}>{props.t("panel.brickLibrary.importCancel")}</button>
          </div>
        </div>
      ) : null}

      {props.showImportForm ? (
        <div style={{ display: "grid", gap: "10px", paddingTop: "4px" }}>
          <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.importHint")}</div>
          <textarea value={props.importDraft} onChange={(event) => props.setImportDraft(event.target.value)} placeholder={props.t("panel.brickLibrary.importPlaceholder")} rows={8} style={{ width: "100%", boxSizing: "border-box", ...ueGhostButton, padding: "10px 12px", resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} />
          {props.importDraft.trim().length > 0 ? (
            <div style={{ ...shellCardStyle, background: ueShellColors.panel }}>
              <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{props.t("panel.brickLibrary.previewTitle")}</strong>
              {props.preview.item === null ? (
                <div style={{ fontSize: "12px", color: "#f3d28b" }}>{props.preview.issues[0] ?? props.t("import.brick.invalid")}</div>
              ) : (
                <>
                  <div style={{ fontSize: "12px", color: ueShellColors.text }}>{props.preview.item.name} / {props.preview.item.packageId}@{props.preview.item.version}</div>
                  <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.previewSourceType", { sourceType: props.preview.sourceType })}</div>
                  <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.previewMeta", { license: props.preview.item.license, compat: props.preview.item.compat, dependencyCount: String(props.preview.item.dependencies.length) })}</div>
                  <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.previewContract")}</div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: props.preview.issues.length > 0 ? "#f3d28b" : ueShellColors.textMuted }}>
                    {(props.preview.issues.length > 0 ? props.preview.issues : [props.t("panel.brickDetails.readyMessage")]).map((issue) => <li key={issue}>{issue}</li>)}
                  </ul>
                </>
              )}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={props.onSubmitImport} style={{ ...ueGhostButton, padding: "8px 12px", background: ueShellColors.accent, borderColor: ueShellColors.accent, color: "#11161d" }}>{props.t("panel.brickLibrary.importReview")}</button>
            <button type="button" onClick={() => { props.setShowImportForm(false); props.setShowImportConfirm(false); }} style={{ ...ueGhostButton, padding: "8px 12px" }}>{props.t("panel.brickLibrary.importCancel")}</button>
          </div>
          {props.importMessage.length > 0 ? <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.importMessage}</div> : null}
          {props.showImportConfirm && props.preview.item !== null ? (
            <div style={{ ...shellCardStyle, background: ueShellColors.panel }}>
              <strong style={{ fontSize: "12px", color: ueShellColors.text }}>{props.t("panel.brickLibrary.confirmTitle")}</strong>
              <div style={{ fontSize: "12px", color: ueShellColors.text }}>{props.preview.item.name} / {props.preview.item.packageId}@{props.preview.item.version}</div>
              <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.previewSourceType", { sourceType: props.preview.sourceType })}</div>
              <div style={{ fontSize: "12px", color: ueShellColors.textMuted }}>{props.t("panel.brickLibrary.previewMeta", { license: props.preview.item.license, compat: props.preview.item.compat, dependencyCount: String(props.preview.item.dependencies.length) })}</div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: props.preview.issues.length > 0 ? "#f3d28b" : ueShellColors.textMuted }}>
                {(props.preview.issues.length > 0 ? props.preview.issues : [props.t("panel.brickLibrary.confirmReady")]).map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={props.onConfirmImport} style={{ ...ueGhostButton, padding: "8px 12px", background: ueShellColors.accent, borderColor: ueShellColors.accent, color: "#11161d" }}>{props.t("panel.brickLibrary.confirmInstall")}</button>
                <button type="button" onClick={() => props.setShowImportConfirm(false)} style={{ ...ueGhostButton, padding: "8px 12px" }}>{props.t("panel.brickLibrary.confirmBack")}</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
