import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import enUSMessages from "./messages.en-US";
import zhCNMessages from "./messages.zh-CN";

export type Locale = "zh-CN" | "en-US";

type MessageKey = keyof typeof zhCNMessages;
type Messages = Record<MessageKey, string>;

type I18nContextValue = {
  locale: Locale;
  switchLocale: (nextLocale: Locale) => void;
  t: (key: MessageKey, params?: Record<string, string | number | boolean>) => string;
};

const STORAGE_KEY = "fate-engine-ui-locale";

const messageMap: Record<Locale, Messages> = {
  "zh-CN": zhCNMessages,
  "en-US": enUSMessages,
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  return storedLocale === "zh-CN" ? "zh-CN" : "en-US";
}

export function I18nProvider(props: { children: ReactNode }): JSX.Element {
  const [locale, setLocale] = useState<Locale>(getInitialLocale());

  const contextValue = useMemo<I18nContextValue>(() => {
    const messages = messageMap[locale];

    const t = (key: MessageKey, params?: Record<string, string | number | boolean>): string => {
      const template = messages[key] ?? zhCNMessages[key];
      if (params === undefined) {
        return template;
      }
      return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
        return result.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
      }, template);
    };

    const switchLocale = (nextLocale: Locale): void => {
      setLocale(nextLocale);
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    };

    return { locale, switchLocale, t };
  }, [locale]);

  return <I18nContext.Provider value={contextValue}>{props.children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context === null) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
