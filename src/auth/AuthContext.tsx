// ============================================================
// auth/AuthContext.tsx
// Stub de autenticación — preparado para Firebase Auth futuro
// Actualmente devuelve usuario null (modo público)
// ============================================================
import { createContext, useContext, type ReactNode } from 'react';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  // signIn / signOut se agregarán cuando se implemente Firebase Auth
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // TODO: Implementar Firebase Auth aquí cuando sea necesario
  // const [user, setUser] = useState<AuthUser | null>(null);
  // useEffect(() => { onAuthStateChanged(auth, ...) }, []);

  return (
    <AuthContext.Provider value={{ user: null, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
