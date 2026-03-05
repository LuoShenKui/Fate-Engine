declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}

declare module "react" {
  export type ReactNode = JSX.Element | string | number | boolean | null | undefined;

  export interface Context<T> {
    Provider: (props: { value: T; children?: ReactNode }) => JSX.Element;
  }

  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void];
}

declare module "react-dom/client" {
  interface Root {
    render(children: JSX.Element): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}

declare module "react/jsx-runtime" {
  export const Fragment: unique symbol;
  export function jsx(type: unknown, props: unknown, key?: unknown): JSX.Element;
  export function jsxs(type: unknown, props: unknown, key?: unknown): JSX.Element;
}
