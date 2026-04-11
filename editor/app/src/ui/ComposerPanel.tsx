import type { AgentApplyReport, AgentComposeResult, ComposeResult } from "../composer";

type ComposerPanelProps = {
  mode: "rules" | "agent";
  onModeChange: (value: "rules" | "agent") => void;
  prompt: string;
  onPromptChange: (value: string) => void;
  onCompose: () => Promise<void> | void;
  onApplyDraft: () => void;
  onRollbackAgentApply: () => void;
  composeResult: ComposeResult | null;
  agentResult: AgentComposeResult | null;
  lastAgentApplyReport: AgentApplyReport | null;
  canRollbackAgentApply: boolean;
  composeHistory: string[];
  onReuseHistory: (value: string) => void;
};

const panelCardStyle = {
  display: "grid",
  gap: "8px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #2a3543",
  background: "linear-gradient(180deg, rgba(43, 51, 62, 0.98) 0%, rgba(34, 42, 52, 0.98) 100%)",
} as const;

const badgeStyle = (tone: "ready" | "warning" | "blocked") =>
  ({
    fontSize: "11px",
    padding: "3px 8px",
    borderRadius: "999px",
    background: tone === "ready" ? "#ddf5df" : tone === "blocked" ? "#ffe3de" : "#fff1cf",
    color: tone === "blocked" ? "#7d2c1f" : tone === "ready" ? "#2d6b2f" : "#7d5400",
  }) as const;

const modeButtonStyle = (active: boolean) =>
  ({
    padding: "7px 11px",
    borderRadius: "999px",
    border: active ? "1px solid #80b4ff" : "1px solid #314051",
    background: active ? "#365274" : "#202833",
    color: "#f3f7fb",
    fontSize: "12px",
    fontWeight: 700,
  }) as const;

const renderDiagnostics = (items: Array<{ code: string; severity: string; message: string; target?: string }>): JSX.Element => (
  <div style={{ display: "grid", gap: "8px" }}>
    {items.length === 0 ? (
      <div style={{ fontSize: "12px", color: "#c6d2df" }}>No blocking diagnostics.</div>
    ) : (
      items.map((item, index) => (
        <div key={`${item.code}-${index}`} style={{ border: "1px solid #314051", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "#c6d2df" }}>
          <div><strong>{item.code}</strong> · {item.severity}</div>
          <div>{item.message}</div>
          {item.target !== undefined ? <div style={{ color: "#8fa1b6" }}>{item.target}</div> : null}
        </div>
      ))
    )}
  </div>
);

export default function ComposerPanel({
  mode,
  onModeChange,
  prompt,
  onPromptChange,
  onCompose,
  onApplyDraft,
  onRollbackAgentApply,
  composeResult,
  agentResult,
  lastAgentApplyReport,
  canRollbackAgentApply,
  composeHistory,
  onReuseHistory,
}: ComposerPanelProps): JSX.Element {
  return (
    <section style={{ display: "grid", gap: "10px", color: "#dfe8f2" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#f3f7fb" }}>Compose</h2>
        <div style={{ marginTop: "4px", fontSize: "12px", color: "#9caec2" }}>
          {mode === "rules"
            ? "Rules mode generates an editable draft for the fixed character foundation intent set."
            : "Agent mode retrieves package summaries, plans directly against the current canvas, and inserts placeholders when bricks are missing."}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" onClick={() => onModeChange("rules")} style={modeButtonStyle(mode === "rules")}>Rules</button>
        <button type="button" onClick={() => onModeChange("agent")} style={modeButtonStyle(mode === "agent")}>Agent</button>
      </div>

      <div style={panelCardStyle}>
        <label style={{ display: "grid", gap: "8px" }}>
          <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Prompt</strong>
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            rows={4}
            placeholder={mode === "rules" ? "Describe walk/run/jump, ladder, pickup, or throw." : "Describe the scene goal. Agent mode can place placeholders for missing bricks."}
            style={{
              resize: "vertical",
              minHeight: "90px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #394759",
              background: "#1d232b",
              color: "#dfe8f2",
              fontFamily: "inherit",
              fontSize: "13px",
              lineHeight: 1.5,
            }}
          />
        </label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => void onCompose()} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #5378aa", background: "#2d4d74", color: "#fff" }}>
            {mode === "rules" ? "Compose Draft" : "Agent Compose To Canvas"}
          </button>
          {mode === "rules" ? (
            <button type="button" onClick={onApplyDraft} disabled={composeResult?.recipeDraft == null} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #5378aa", background: composeResult?.recipeDraft == null ? "#2d3641" : "#41694c", color: "#fff", opacity: composeResult?.recipeDraft == null ? 0.7 : 1 }}>
              Apply Draft To Canvas
            </button>
          ) : (
            <button type="button" onClick={onRollbackAgentApply} disabled={!canRollbackAgentApply} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid #5378aa", background: canRollbackAgentApply ? "#6b4a31" : "#2d3641", color: "#fff", opacity: canRollbackAgentApply ? 1 : 0.7 }}>
              Roll Back Last Agent Apply
            </button>
          )}
        </div>
      </div>

      {composeHistory.length > 0 ? (
        <div style={panelCardStyle}>
          <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Recent Inputs</strong>
          <div style={{ display: "grid", gap: "8px" }}>
            {composeHistory.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onReuseHistory(item)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #314051",
                  background: "#202833",
                  color: "#dfe8f2",
                  fontSize: "12px",
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {mode === "rules" && composeResult !== null ? (
        <>
          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Intent</strong>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {composeResult.intent.capabilityIds.length === 0 ? <span style={badgeStyle("blocked")}>No supported intent</span> : null}
              {composeResult.intent.capabilityIds.map((item) => (
                <span key={item} style={badgeStyle("ready")}>{item}</span>
              ))}
            </div>
            {composeResult.intent.unmatchedFragments.length > 0 ? (
              <div style={{ fontSize: "12px", color: "#a9b8c9" }}>
                Unmatched: {composeResult.intent.unmatchedFragments.join(", ")}
              </div>
            ) : null}
          </div>

          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Diagnostics</strong>
            {renderDiagnostics(composeResult.diagnostics)}
          </div>

          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Compose Plan</strong>
            <div style={{ display: "grid", gap: "8px" }}>
              {composeResult.plan.nodes.map((node) => (
                <div key={node.nodeId} style={{ border: "1px solid #314051", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "#c6d2df" }}>
                  <div><strong>{node.nodeId}</strong> → {node.brickId}</div>
                  <div>{node.packageId}@{node.version}</div>
                  <div>{node.capabilityId}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Bindings</strong>
            <div style={{ display: "grid", gap: "8px" }}>
              {composeResult.bindingSummary.map((item) => (
                <div key={`${item.slotId}-${item.assetRef || item.bindingKind}`} style={{ border: "1px solid #314051", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "#c6d2df" }}>
                  <div><strong>{item.slotId}</strong> → {item.assetRef || "<unresolved>"}</div>
                  <div>{item.bindingKind} · {item.resourceType}</div>
                  <div>{item.sourcePackageId}@{item.sourcePackageVersion} · {item.sourceResourceId}</div>
                  <div style={{ color: "#8fa1b6" }}>{item.reason}</div>
                  {item.issues.length > 0 ? <div style={{ color: "#f1c27d" }}>{item.issues.join(" | ")}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {mode === "agent" && agentResult !== null ? (
        <>
          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Agent Plan</strong>
            <div style={{ fontSize: "12px", color: "#c6d2df" }}>
              {agentResult.plan?.reasoningSummary ?? "No applicable plan."}
            </div>
            {lastAgentApplyReport !== null ? (
              <div style={{ fontSize: "12px", color: "#8fa1b6" }}>
                Applied {lastAgentApplyReport.replacedNodeCount} nodes · {lastAgentApplyReport.placeholderCount} placeholders · {lastAgentApplyReport.gapCount} gaps
              </div>
            ) : null}
          </div>

          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Diagnostics</strong>
            {renderDiagnostics(agentResult.diagnostics)}
          </div>

          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Nodes</strong>
            <div style={{ display: "grid", gap: "8px" }}>
              {(agentResult.plan?.nodes ?? []).map((node) => {
                const isPlaceholder = agentResult.plan?.gapReport.some((gap) => gap.nodeId === node.nodeId || gap.packageId === node.packageId) ?? false;
                return (
                  <div key={node.nodeId} style={{ border: "1px solid #314051", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "#c6d2df" }}>
                    <div><strong>{node.nodeId}</strong> → {node.brickId}</div>
                    <div>{node.packageId}</div>
                    <div>{node.capabilityId}</div>
                    <div>{isPlaceholder ? <span style={badgeStyle("warning")}>placeholder</span> : <span style={badgeStyle("ready")}>installed</span>}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Gap Report</strong>
            <div style={{ display: "grid", gap: "8px" }}>
              {(agentResult.plan?.gapReport ?? []).length === 0 ? (
                <div style={{ fontSize: "12px", color: "#c6d2df" }}>No gaps. Agent landed only installed bricks.</div>
              ) : (
                (agentResult.plan?.gapReport ?? []).map((gap, index) => (
                  <div key={`${gap.type}-${index}`} style={{ border: "1px solid #314051", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "#c6d2df" }}>
                    <div><strong>{gap.type}</strong></div>
                    <div>{gap.message}</div>
                    <div style={{ color: "#8fa1b6" }}>{gap.packageId ?? gap.capabilityId ?? gap.nodeId}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={panelCardStyle}>
            <strong style={{ fontSize: "13px", color: "#f3f7fb" }}>Sources</strong>
            <div style={{ display: "grid", gap: "8px" }}>
              {(agentResult.plan?.sources ?? []).length === 0 ? (
                <div style={{ fontSize: "12px", color: "#c6d2df" }}>No remote package summaries were used.</div>
              ) : (
                (agentResult.plan?.sources ?? []).map((source) => (
                  <div key={`${source.url}-${source.packageId ?? source.title}`} style={{ border: "1px solid #314051", borderRadius: "8px", padding: "8px", fontSize: "12px", color: "#c6d2df" }}>
                    <div><strong>{source.title}</strong></div>
                    <div>{source.usedFor}</div>
                    <div style={{ color: "#8fa1b6" }}>{source.packageId ?? source.url}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
