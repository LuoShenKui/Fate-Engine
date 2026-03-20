import { useEffect, useMemo, useState } from "react";
import { renderDockSection } from "./app-chrome";
import type { HiddenPanels } from "./editor-layout-state";
import { ueGhostButton, ueShellColors } from "./ue-shell-theme";

type LeftWorkspacePanelProps = {
  hiddenPanels: HiddenPanels;
  brickLibrary: JSX.Element;
  assetLibrary: JSX.Element;
  brickCount: number;
  assetCount: number;
  maximizeAction?: JSX.Element;
};

type LeftTabKey = "library" | "assets";

const leftTabMeta: Record<LeftTabKey, { title: string; countLabel: (props: LeftWorkspacePanelProps) => string }> = {
  library: { title: "Brick Registry", countLabel: (props) => `${props.brickCount} packages` },
  assets: { title: "Assets", countLabel: (props) => `${props.assetCount} imported` },
};

export default function LeftWorkspacePanel(props: LeftWorkspacePanelProps): JSX.Element | undefined {
  const visibleTabs = useMemo<LeftTabKey[]>(
    () => (["library", "assets"] as LeftTabKey[]).filter((key) => !props.hiddenPanels[key]),
    [props.hiddenPanels],
  );
  const [activeTab, setActiveTab] = useState<LeftTabKey>(visibleTabs[0] ?? "library");

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] ?? "library");
    }
  }, [activeTab, visibleTabs]);

  if (visibleTabs.length === 0) {
    return undefined;
  }

  const currentMeta = leftTabMeta[activeTab];
  const currentBody = activeTab === "library" ? props.brickLibrary : props.assetLibrary;

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", gap: "8px", minHeight: 0, height: "100%" }}>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {visibleTabs.map((tab) => {
          const active = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                ...ueGhostButton,
                padding: "6px 10px",
                borderRadius: "999px",
                background: active ? ueShellColors.accent : ueShellColors.panelMuted,
                borderColor: active ? ueShellColors.accent : ueShellColors.borderStrong,
                color: active ? "#11161d" : ueShellColors.text,
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {leftTabMeta[tab].title}
            </button>
          );
        })}
      </div>
      <div style={{ minHeight: 0, height: "100%" }}>
        {renderDockSection(currentMeta.title, currentMeta.countLabel(props), currentBody, props.maximizeAction)}
      </div>
    </div>
  );
}
