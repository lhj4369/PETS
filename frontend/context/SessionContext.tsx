import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AuthManager from "../utils/AuthManager";
import API_BASE_URL from "../config/api";

type SessionState = {
  isMaster: boolean;
  unlocks: string[];
  loaded: boolean;
};

type SessionContextValue = SessionState & {
  refreshSession: () => Promise<void>;
  setSessionFromLogin: (payload: { isMaster?: boolean; unlocks?: string[] }) => void;
  isUnlocked: (key: string) => boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    isMaster: false,
    unlocks: [],
    loaded: false,
  });

  const refreshSession = useCallback(async () => {
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        setState({ isMaster: false, unlocks: [], loaded: true });
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
      if (!res.ok) {
        setState({ isMaster: false, unlocks: [], loaded: true });
        return;
      }
      const data = await res.json();
      setState({
        isMaster: !!data.isMaster,
        unlocks: Array.isArray(data.unlocks) ? data.unlocks : [],
        loaded: true,
      });
    } catch {
      setState({ isMaster: false, unlocks: [], loaded: true });
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const setSessionFromLogin = useCallback((payload: { isMaster?: boolean; unlocks?: string[] }) => {
    setState({
      isMaster: !!payload.isMaster,
      unlocks: payload.unlocks ?? [],
      loaded: true,
    });
  }, []);

  const isUnlocked = useCallback(
    (key: string) => {
      if (state.isMaster) return true;
      return state.unlocks.includes(key);
    },
    [state.isMaster, state.unlocks]
  );

  const value = useMemo(
    () => ({
      ...state,
      refreshSession,
      setSessionFromLogin,
      isUnlocked,
    }),
    [state, refreshSession, setSessionFromLogin, isUnlocked]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession은 SessionProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}
