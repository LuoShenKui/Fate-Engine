const zhCNMessages = {
  "app.title": "Fate 引擎编辑器",
  "toolbar.title": "工具栏",
  "toolbar.interact": "交互",
  "toolbar.playMode": "Play 模式(enabled={enabled})",
  "toolbar.toggleLock": "切换锁定(locked={locked})",
  "toolbar.import": "导入",
  "toolbar.export": "导出",
  "toolbar.save": "保存",
  "toolbar.load": "加载",
  "toolbar.applyTemplate": "应用模板",
  "toolbar.adapterMode": "适配器模式：{mode}（点击切换）",
  "toolbar.locale.zh": "中文",
  "toolbar.locale.en": "EN",

  "panel.brickPalette.title": "积木面板",
  "panel.graphCanvas.title": "画布",
  "panel.graphCanvas.placeholder": "节点/连线画布预留区域",
  "panel.propertyInspector.title": "属性面板",
  "panel.propertyInspector.currentNode": "当前节点：{nodeName}",
  "panel.validation.title": "校验结果",
  "panel.validation.business": "业务校验",
  "panel.validation.protocol": "协议校验",

  "validation.waiting": "等待校验",
  "validation.ok": "通过",
  "validation.protocolErrorPrefix": "协议错误: {errorText}",
  "validation.eventPrefix": "事件: {eventText}",
  "validation.level.Error": "错误",
  "validation.level.Warning": "警告",
  "validation.level.Info": "信息",
  "validation.compareDiff": "与上次相比：错误 {errorDelta}，警告 {warningDelta}",

  "lockfile.locked": "lockfile：已锁定",
  "lockfile.unlocked": "lockfile：未锁定",

  "template.applied": "模板已应用",

  "import.prompt": "请粘贴配方 JSON",
  "import.failed": "导入失败：JSON 无法解析",
  "import.success": "导入成功",
  "export.started": "已开始导出",
  "save.success": "已保存到本地",
  "save.failed": "保存失败",
  "load.notFound": "未找到可加载的本地数据",
  "load.success": "加载成功",
} as const;

export default zhCNMessages;
