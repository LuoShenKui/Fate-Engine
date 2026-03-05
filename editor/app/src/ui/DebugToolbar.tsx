import { useI18n, type Locale } from "./i18n/I18nProvider";

type DebugToolbarProps = {
  locked: boolean;
  adapterMode: "demo" | "runtime";
  onToggleAdapterMode: () => void;
  onInteract: () => void;
  onToggleLock: () => void;
  onImport: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onApplyTemplate: () => void;
  lockStatusText: string;
  appTitle: string;
};

export default function DebugToolbar(props: DebugToolbarProps): JSX.Element {
  const { locale, switchLocale, t } = useI18n();
  const nextLocale: Locale = locale === "zh-CN" ? "en-US" : "zh-CN";

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
      <strong data-testid="editor-page-ready">{props.appTitle}</strong>
      <button type="button" onClick={props.onInteract}>
        {t("toolbar.interact")}
      </button>
      <button type="button" onClick={props.onToggleLock}>
        {t("toolbar.toggleLock", { locked: String(props.locked) })}
      </button>
      <button type="button" onClick={props.onImport}>
        {t("toolbar.import")}
      </button>
      <button type="button" onClick={props.onExport}>
        {t("toolbar.export")}
      </button>
      <button type="button" onClick={props.onSave}>
        {t("toolbar.save")}
      </button>
      <button type="button" onClick={props.onLoad}>
        {t("toolbar.load")}
      </button>
      <button type="button" onClick={props.onApplyTemplate}>
        {t("toolbar.applyTemplate")}
      </button>
      <button type="button" onClick={props.onToggleAdapterMode}>
        {t("toolbar.adapterMode", { mode: props.adapterMode })}
      </button>
      <span>{props.lockStatusText}</span>
      <button type="button" onClick={() => switchLocale(nextLocale)}>
        {t("toolbar.locale.zh")} / {t("toolbar.locale.en")}
      </button>
    </div>
  );
}
