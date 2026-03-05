import { createRoot } from "react-dom/client";
import App from "./ui/App";
import { I18nProvider } from "./ui/i18n/I18nProvider";

const rootEl = document.querySelector<HTMLDivElement>("#app");

if (!rootEl) {
  throw new Error("UI 初始化失败：缺少根节点 #app");
}

createRoot(rootEl).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
);
