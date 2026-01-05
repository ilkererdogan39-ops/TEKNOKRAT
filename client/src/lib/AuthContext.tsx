import { createContext, useContext, useState, useEffect } from "react";
import type { AuthSession, SafeParticipant } from "@shared/schema";

interface AuthContextType {
  session: AuthSession | null;
  participant: SafeParticipant | null;
  login: (session: AuthSession, participant?: SafeParticipant) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [participant, setParticipant] = useState<SafeParticipant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("lms-session");
    const storedParticipant = localStorage.getItem("lms-participant");
    if (stored) {
      setSession(JSON.parse(stored));
    }
    if (storedParticipant) {
      setParticipant(JSON.parse(storedParticipant));
    }
    setIsLoading(false);
  }, []);

  const login = (newSession: AuthSession, newParticipant?: SafeParticipant) => {
    setSession(newSession);
    localStorage.setItem("lms-session", JSON.stringify(newSession));
    if (newParticipant) {
      setParticipant(newParticipant);
      localStorage.setItem("lms-participant", JSON.stringify(newParticipant));
    }
  };

  const logout = () => {
    setSession(null);
    setParticipant(null);
    localStorage.removeItem("lms-session");
    localStorage.removeItem("lms-participant");
  };

  return (
    <AuthContext.Provider value={{ session, participant, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
