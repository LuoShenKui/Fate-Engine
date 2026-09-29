import { useMemo, useState } from "react";
import type { AssetLibraryItem } from "./AssetLibraryPanel";
import type { ValidationItem } from "./ValidationPanel";
import { ueShellColors } from "./ue-shell-theme";

type ProjectConsoleDockProps = {
  assets: AssetLibraryItem[];
  validationItems: ValidationItem[];
  protocolItems: ValidationItem[];
};

const folders = ["Scenes", "Characters", "Models", "Materials", "Textures", "Animations", "Audio", "Scripts", "Prefabs", "UI"];

export default function ProjectConsoleDock(props: ProjectConsoleDockProps): JSX.Element {
  const [selectedFolder, setSelectedFolder] = useState("Scenes");
  const [activeLogTab, setActiveLogTab] = useState<"console" | "problems">("console");
  const visibleAssets = useMemo(() => props.assets.slice(0, 12), [props.assets]);
  const problems = [...props.validationItems, ...props.protocolItems];
  const counts = {
    info: problems.filter((item) => item.level === "Info").length,
    warning: problems.filter((item) => item.level === "Warning").length,
    error: problems.filter((item) => item.level === "Error").length,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, .85fr)", height: "100%", minHeight: 0, background: ueShellColors.panel }}>
      <section style={{ display: "grid", gridTemplateRows: "30px minmax(0,1fr)", minWidth: 0, borderRight: `1px solid ${ueShellColors.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 10px", borderBottom: `1px solid ${ueShellColors.border}`, background: ueShellColors.panelMuted, fontSize: "11px", fontWeight: 700 }}>
          <span style={{ color: "#ffffff" }}>Project</span>
          <span style={{ color: ueShellColors.textMuted }}>Assets</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "190px minmax(0,1fr)", minHeight: 0 }}>
          <div style={{ overflow: "auto", borderRight: `1px solid ${ueShellColors.border}`, padding: "6px" }}>
            <div style={{ padding: "4px 7px", color: "#f2f4f7", fontSize: "12px", fontWeight: 700 }}>▾ Assets</div>
            {folders.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                style={{
                  width: "100%",
                  border: 0,
                  borderRadius: "3px",
                  padding: "5px 10px 5px 22px",
                  textAlign: "left",
                  background: selectedFolder === folder ? "#255b96" : "transparent",
                  color: selectedFolder === folder ? "#fff" : ueShellColors.text,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                ▰ {folder}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateRows: "34px minmax(0,1fr)", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 9px", borderBottom: `1px solid ${ueShellColors.border}` }}>
              <span style={{ color: ueShellColors.textMuted, fontSize: "11px" }}>Assets › {selectedFolder}</span>
              <input placeholder="Search..." style={{ marginLeft: "auto", width: "190px", border: `1px solid ${ueShellColors.borderStrong}`, background: "#171c22", color: ueShellColors.text, borderRadius: "4px", padding: "5px 7px", fontSize: "10px" }} />
            </div>
            <div style={{ overflow: "auto", padding: "10px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", alignContent: "start", gap: "10px" }}>
              {visibleAssets.length === 0 ? (
                <div style={{ color: ueShellColors.textMuted, fontSize: "11px" }}>No imported assets yet.</div>
              ) : visibleAssets.map((asset) => (
                <div key={asset.id} title={asset.assetRef} style={{ display: "grid", gap: "6px", minWidth: 0 }}>
                  <div style={{ height: "62px", border: `1px solid ${ueShellColors.borderStrong}`, borderRadius: "4px", background: "linear-gradient(145deg,#334254,#1b222b)", display: "grid", placeItems: "center", color: "#a9bad0", fontSize: "10px", fontWeight: 800 }}>
                    {asset.resourceType.toUpperCase().slice(0, 8)}
                  </div>
                  <div style={{ color: ueShellColors.text, fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateRows: "30px minmax(0,1fr)", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 10px", borderBottom: `1px solid ${ueShellColors.border}`, background: ueShellColors.panelMuted, fontSize: "11px", fontWeight: 700 }}>
          <button type="button" onClick={() => setActiveLogTab("console")} style={{ border: 0, background: "transparent", color: activeLogTab === "console" ? "#fff" : ueShellColors.textMuted, cursor: "pointer", fontWeight: 700 }}>Console</button>
          <button type="button" onClick={() => setActiveLogTab("problems")} style={{ border: 0, background: "transparent", color: activeLogTab === "problems" ? "#fff" : ueShellColors.textMuted, cursor: "pointer", fontWeight: 700 }}>Problems</button>
          <span style={{ marginLeft: "auto", color: "#75aef0" }}>● {counts.info}</span>
          <span style={{ color: "#e3b341" }}>▲ {counts.warning}</span>
          <span style={{ color: "#ef6a67" }}>● {counts.error}</span>
        </div>
        <div style={{ overflow: "auto", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "10px" }}>
          {(activeLogTab === "problems" ? problems : props.validationItems).slice(-30).map((item, index) => {
            const color = item.level === "Error" ? "#ef6a67" : item.level === "Warning" ? "#e3b341" : "#75aef0";
            return (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: "5px", padding: "7px 9px", borderBottom: `1px solid ${ueShellColors.border}`, color: ueShellColors.text }}>
                <span style={{ color }}>{item.level === "Error" ? "●" : item.level === "Warning" ? "▲" : "●"}</span>
                <span>{item.message}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
