import type { EditorPanelKey, HiddenPanels } from "./editor-layout-state";
import type { TranslateFn } from "./i18n/I18nProvider";
import type { ToolbarMenuItem } from "./toolbar-menu-model";

type BuildToolbarMenusArgs = {
  isEnglish: boolean;
  hiddenPanels: HiddenPanels;
  locked: boolean;
  adapterMode: "demo" | "runtime";
  playMode: boolean;
  playtestFullscreen: boolean;
  onInteract: () => void;
  onToggleAdapterMode: () => void;
  onTogglePlayMode: () => void;
  onToggleLock: () => void;
  onImport: () => void;
  onImportBrick: () => void;
  onExport: () => void;
  onSave: () => void;
  onLoad: () => void;
  onApplyTemplate: () => void;
  onOpenInstall: () => void;
  onOpenDetails: () => void;
  onOpenInspector: () => void;
  onOpenCommandPalette: () => void;
  onOpenCompose: () => void;
  onOpenExportReview: () => void;
  onOpenNarrativeDebug: () => void;
  onBeginNarrativeFixtureSession: () => void;
  onOpenBrickLibrary: () => void;
  onOpenAssetLibrary: () => void;
  onOpenValidation: () => void;
  onTogglePanel: (panel: EditorPanelKey) => void;
  onTogglePlaytestFullscreen: () => void;
  onSwitchLocale: () => void;
  t: TranslateFn;
};

export type ToolbarMenuGroup = {
  label: string;
  items: ToolbarMenuItem[];
};

export const buildToolbarMenus = (args: BuildToolbarMenusArgs): ToolbarMenuGroup[] => {
  const panelToggleLabel = (panel: EditorPanelKey, zhLabel: string, enLabel: string): string =>
    args.hiddenPanels[panel] ? (args.isEnglish ? `Show ${enLabel}` : `显示${zhLabel}`) : args.isEnglish ? `Hide ${enLabel}` : `隐藏${zhLabel}`;

  return [
    {
      label: args.isEnglish ? "Command" : "命令",
      items: [
        {
          label: args.isEnglish ? "Open Command Palette" : "打开命令面板",
          hint: args.isEnglish ? "Search and execute editor commands" : "搜索并执行编辑器命令",
          shortcut: "Cmd+K",
          commandId: "command.palette.open",
          onSelect: args.onOpenCommandPalette,
        },
      ],
    },
    {
      label: args.isEnglish ? "File" : "文件",
      items: [
        {
          label: args.isEnglish ? "Recipe" : "配方",
          items: [
            { label: args.t("toolbar.import"), hint: args.isEnglish ? "Load a recipe draft into the editor" : "把配方草稿载入编辑器", shortcut: "Cmd+I", commandId: "file.import", onSelect: args.onImport },
            { label: args.t("toolbar.export"), hint: args.isEnglish ? "Export the current recipe and white-box data" : "导出当前配方和白盒数据", shortcut: "Cmd+E", commandId: "file.export", onSelect: args.onExport },
            { label: args.t("toolbar.save"), hint: args.isEnglish ? "Persist the current recipe snapshot" : "保存当前配方快照", shortcut: "Cmd+S", commandId: "file.save", onSelect: args.onSave },
            { label: args.t("toolbar.load"), hint: args.isEnglish ? "Restore a saved local recipe snapshot" : "加载本地保存的配方快照", shortcut: "Cmd+O", commandId: "file.load", onSelect: args.onLoad },
          ],
        },
      ],
    },
    {
      label: args.isEnglish ? "Bricks" : "积木",
      items: [
        {
          label: args.isEnglish ? "Packages" : "包管理",
          items: [{ label: args.t("toolbar.importBrick"), hint: args.isEnglish ? "Install a brick or lockfile package" : "安装积木或锁文件包", shortcut: "Shift+Cmd+I", commandId: "bricks.import", onSelect: args.onImportBrick }],
        },
        {
          label: args.isEnglish ? "Workspace" : "工作区",
          items: [
            {
              label: args.isEnglish ? "Open Brick Registry" : "打开积木库",
              hint: args.isEnglish ? "Focus the left workspace on the brick registry" : "聚焦到左侧积木库",
              shortcut: "Shift+Cmd+B",
              commandId: "bricks.workspace.open",
              onSelect: args.onOpenBrickLibrary,
            },
            { label: panelToggleLabel("library", "积木库", "Brick Registry"), hint: args.isEnglish ? "Show or hide the installed brick registry" : "显示或隐藏已安装积木库", commandId: "bricks.panel.toggle", onSelect: () => args.onTogglePanel("library") },
          ],
        },
      ],
    },
    {
      label: args.isEnglish ? "Assets" : "资源",
      items: [
        {
          label: args.isEnglish ? "Library" : "资源库",
          items: [
            {
              label: args.isEnglish ? "Open Asset Library" : "打开资源库",
              hint: args.isEnglish ? "Focus the left workspace on the asset registry" : "聚焦到左侧资源库",
              shortcut: "Shift+Cmd+A",
              commandId: "assets.workspace.open",
              onSelect: args.onOpenAssetLibrary,
            },
            { label: panelToggleLabel("assets", "资源库", "Assets"), hint: args.isEnglish ? "Show or hide the asset registry" : "显示或隐藏资源库", commandId: "assets.panel.toggle", onSelect: () => args.onTogglePanel("assets") },
          ],
        },
      ],
    },
    {
      label: args.isEnglish ? "Scene" : "场景",
      items: [
        { label: args.t("toolbar.applyTemplate"), hint: args.isEnglish ? "Apply a built-in world template" : "应用内置世界模板", shortcut: "Shift+Cmd+T", commandId: "scene.apply-template", onSelect: args.onApplyTemplate },
        ...(args.playMode ? [] : [{ label: args.t("toolbar.interact"), hint: args.isEnglish ? "Send an interaction event into the scene" : "向场景发送交互事件", shortcut: "Space", commandId: "scene.interact", onSelect: args.onInteract }]),
        {
          label: args.isEnglish ? "Preview" : "预览",
          items: [{ label: args.t("toolbar.playMode", { enabled: String(args.playMode) }), hint: args.isEnglish ? "Toggle edit and play preview state" : "切换编辑和预览状态", shortcut: "Cmd+P", commandId: "scene.play-mode", onSelect: args.onTogglePlayMode }],
        },
      ],
    },
    {
      label: args.isEnglish ? "AI" : "智能",
      items: [
        {
          label: args.isEnglish ? "Assembly" : "装配",
          items: [
            {
              label: args.isEnglish ? "Open Install Report" : "打开安装报告",
              hint: args.isEnglish ? "Jump to install and package diagnostics" : "跳转到安装与包问题面板",
              shortcut: "Alt+1",
              commandId: "workspace.install.open",
              onSelect: args.onOpenInstall,
            },
            {
              label: args.isEnglish ? "Open Details" : "打开详情",
              hint: args.isEnglish ? "Jump to the selected brick details panel" : "跳转到当前选中积木详情",
              shortcut: "Alt+2",
              commandId: "workspace.details.open",
              onSelect: args.onOpenDetails,
            },
            {
              label: args.isEnglish ? "Open Inspector" : "打开属性面板",
              hint: args.isEnglish ? "Jump to scene property inspection" : "跳转到场景属性检查面板",
              shortcut: "Alt+3",
              commandId: "workspace.inspector.open",
              onSelect: args.onOpenInspector,
            },
            {
              label: args.isEnglish ? "Open Compose Panel" : "打开装配面板",
              hint: args.isEnglish ? "Jump to the compose and agent workspace" : "跳转到规则装配和 Agent 装配工作区",
              shortcut: "Shift+Cmd+K",
              commandId: "ai.compose.open",
              onSelect: args.onOpenCompose,
            },
          ],
        },
        {
          label: args.isEnglish ? "Review" : "审阅",
          items: [
            {
              label: args.isEnglish ? "Open Export Review" : "打开导出审阅",
              hint: args.isEnglish ? "Review generated white-box export payloads" : "审阅当前生成的白盒导出内容",
              shortcut: "Shift+Cmd+E",
              commandId: "ai.export-review.open",
              onSelect: args.onOpenExportReview,
            },
            {
              label: args.isEnglish ? "Open Validation Output" : "打开校验输出",
              hint: args.isEnglish ? "Focus the bottom validation dock" : "聚焦到底部校验输出区",
              shortcut: "Shift+Cmd+V",
              commandId: "workspace.validation.open",
              onSelect: args.onOpenValidation,
            },
            {
              label: args.isEnglish ? "Open Narrative Debug" : "打开叙事调试",
              hint: args.isEnglish ? "Inspect dialogue turns, local model state, audit, and snapshots" : "查看对话回合、本地模型状态、审计和快照",
              shortcut: "Shift+Cmd+D",
              commandId: "ai.narrative-debug.open",
              onSelect: args.onOpenNarrativeDebug,
            },
            {
              label: args.isEnglish ? "Open Dialogue History" : "打开对话历史",
              hint: args.isEnglish ? "Focus the narrative workspace on persisted dialogue history" : "聚焦到叙事工作区并查看持久化对话历史",
              commandId: "ai.dialogue-history.open",
              onSelect: args.onOpenNarrativeDebug,
            },
            {
              label: args.isEnglish ? "Open Runtime Audit" : "打开运行时审计",
              hint: args.isEnglish ? "Focus the narrative workspace on runtime audit traces" : "聚焦到叙事工作区并查看运行时审计轨迹",
              commandId: "ai.runtime-audit.open",
              onSelect: args.onOpenNarrativeDebug,
            },
            {
              label: args.isEnglish ? "Begin Fixture Session" : "开始样板会话",
              hint: args.isEnglish ? "Start the built-in narrative fixture conversation" : "启动内置叙事样板会话",
              commandId: "ai.fixture-session.begin",
              onSelect: args.onBeginNarrativeFixtureSession,
            },
          ],
        },
      ],
    },
    {
      label: args.isEnglish ? "Window" : "窗口",
      items: [
        {
          label: args.isEnglish ? "Left Dock" : "左侧",
          items: [
            { label: panelToggleLabel("library", "积木库", "Brick Registry"), onSelect: () => args.onTogglePanel("library") },
            { label: panelToggleLabel("samples", "森林小屋 Demo", "Forest Demo"), onSelect: () => args.onTogglePanel("samples") },
            { label: panelToggleLabel("assets", "资源库", "Assets"), onSelect: () => args.onTogglePanel("assets") },
          ],
        },
        {
          label: args.isEnglish ? "Right Dock" : "右侧",
          items: [
            { label: args.isEnglish ? "Open Install Report" : "打开安装报告", commandId: "window.right.install", onSelect: args.onOpenInstall },
            { label: args.isEnglish ? "Open Details" : "打开详情", commandId: "window.right.details", onSelect: args.onOpenDetails },
            { label: args.isEnglish ? "Open Inspector" : "打开属性面板", commandId: "window.right.inspector", onSelect: args.onOpenInspector },
            { label: args.isEnglish ? "Open Compose" : "打开装配", commandId: "window.right.compose", onSelect: args.onOpenCompose },
            { label: args.isEnglish ? "Open Export Review" : "打开导出审阅", commandId: "window.right.export", onSelect: args.onOpenExportReview },
            { label: args.isEnglish ? "Open Narrative Debug" : "打开叙事调试", commandId: "window.right.narrative", onSelect: args.onOpenNarrativeDebug },
            { label: panelToggleLabel("inspector", "右侧面板", "Inspector"), commandId: "window.right.toggle", onSelect: () => args.onTogglePanel("inspector") },
          ],
        },
        {
          label: args.isEnglish ? "Bottom Dock" : "底部",
          items: [
            { label: args.isEnglish ? "Open Validation Output" : "打开校验输出", commandId: "window.bottom.validation", onSelect: args.onOpenValidation },
            { label: panelToggleLabel("validation", "校验区", "Output"), commandId: "window.bottom.toggle", onSelect: () => args.onTogglePanel("validation") },
          ],
        },
      ],
    },
    {
      label: args.isEnglish ? "Runtime" : "运行时",
      items: [
        { label: args.t("toolbar.toggleLock", { locked: String(args.locked) }), hint: args.isEnglish ? "Prevent accidental edits during runtime review" : "在运行时审阅时防止误编辑", shortcut: "Cmd+L", commandId: "runtime.lock", onSelect: args.onToggleLock },
        { label: args.t("toolbar.adapterMode", { mode: args.adapterMode }), hint: args.isEnglish ? "Switch between demo and runtime adapters" : "切换 demo 与 runtime 适配器", separatorBefore: true, commandId: "runtime.adapter-mode", onSelect: args.onToggleAdapterMode },
      ],
    },
    {
      label: args.isEnglish ? "Test" : "测试",
      items: [
        {
          label: args.isEnglish ? "3D Validation" : "3D 验证",
          items: [
            {
              label: args.playtestFullscreen ? (args.isEnglish ? "Exit 3D Test" : "退出全屏测试") : args.isEnglish ? "Launch 3D Test" : "一键 3D 测试",
              hint: args.isEnglish ? "Open the 3D validation room in fullscreen mode" : "以全屏模式打开 3D 验证场景",
              shortcut: "Shift+Cmd+P",
              commandId: "test.fullscreen",
              onSelect: args.onTogglePlaytestFullscreen,
            },
          ],
        },
      ],
    },
    {
      label: args.isEnglish ? "Language" : "语言",
      items: [
        {
          label: args.isEnglish ? "Switch Locale" : "切换语言",
          items: [{ label: `${args.t("toolbar.locale.zh")} / ${args.t("toolbar.locale.en")}`, hint: args.isEnglish ? "Switch the editor interface language" : "切换编辑器界面语言", commandId: "language.switch", onSelect: args.onSwitchLocale }],
        },
      ],
    },
  ];
};
