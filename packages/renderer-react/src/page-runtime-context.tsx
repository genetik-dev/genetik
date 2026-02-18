import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  createEventEmitter,
  getContextValue,
  setContextValue,
  type PageContext,
  type PageEventCallback,
  type PageEventPayload,
} from "@genetik/context-events";

export interface PageRuntimeContextValue {
  context: PageContext;
  updateContext: (path: string, value: unknown) => void;
  emit: (eventName: string, payload: PageEventPayload) => void;
}

const PageRuntimeContext = createContext<PageRuntimeContextValue | null>(null);

export interface PageRuntimeProviderProps {
  context: PageContext;
  onContextUpdate?: (path: string, value: unknown) => void;
  onEvent?: PageEventCallback;
  children: ReactNode;
}

export function PageRuntimeProvider({
  context,
  onContextUpdate,
  onEvent,
  children,
}: PageRuntimeProviderProps): ReactNode {
  const updateContext = useCallback(
    (path: string, value: unknown) => {
      if (onContextUpdate) {
        onContextUpdate(path, value);
      } else {
        setContextValue(context, path, value);
      }
    },
    [context, onContextUpdate]
  );

  const emit = useMemo(
    () => createEventEmitter(onEvent),
    [onEvent]
  );

  const value = useMemo<PageRuntimeContextValue>(
    () => ({ context, updateContext, emit }),
    [context, updateContext, emit]
  );

  return (
    <PageRuntimeContext.Provider value={value}>
      {children}
    </PageRuntimeContext.Provider>
  );
}

export function usePageRuntime(): PageRuntimeContextValue | null {
  return useContext(PageRuntimeContext);
}

/** Read a value from the current page context; returns undefined if no provider or path missing. */
export function usePageContextValue(path: string): unknown {
  const runtime = usePageRuntime();
  if (!runtime) return undefined;
  return getContextValue(runtime.context, path);
}
