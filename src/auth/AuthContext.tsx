// ============================================================
// auth/AuthContext.tsx
// Contexto de Autenticación: OAuth con Google/GitHub + Whitelist en RTDB
// ============================================================
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';

import { auth, db, isFirebaseConfigured } from '../firebase/config';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  unauthorizedUser: { uid: string; email: string | null } | null;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearUnauthorizedUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Si estamos en modo demo y ya había sesión guardada, recuperarla
    const savedDemoUser = localStorage.getItem('rfid_demo_user');
    if (!isFirebaseConfigured && savedDemoUser) {
      try {
        return JSON.parse(savedDemoUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorizedUser, setUnauthorizedUser] = useState<{ uid: string; email: string | null } | null>(null);

  // ─── Whitelist Check ───────────────────────────────────────
  const checkWhitelistAndSetUser = async (firebaseUser: FirebaseUser): Promise<boolean> => {
    try {
      const whitelistRef = ref(db, `usuarios_dashboard/${firebaseUser.uid}`);
      const snapshot = await get(whitelistRef);

      if (!snapshot.exists()) {
        setUnauthorizedUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        await signOut(auth);
        setError('Acceso denegado: Su cuenta no está registrada en la lista de usuarios autorizados.');
        setUser(null);
        return false;
      }

      const data = snapshot.val();
      if (data.activo !== true) {
        setUnauthorizedUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        await signOut(auth);
        setError('Acceso denegado: Su cuenta se encuentra actualmente desactivada.');
        setUser(null);
        return false;
      }

      // Usuario autorizado
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: data.rol || 'viewer',
        activo: true,
        mfaVerified: false, // Stub para TOTP
      };

      setUser(authUser);
      setError(null);
      setUnauthorizedUser(null);
      return true;
    } catch (err: any) {
      console.error('Error al consultar whitelist:', err);
      await signOut(auth);
      setError('Error al verificar los permisos en la base de datos.');
      setUser(null);
      return false;
    }
  };

  // ─── Listener onAuthStateChanged ───────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await checkWhitelistAndSetUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ─── Métodos OAuth ──────────────────────────────────────────

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    setUnauthorizedUser(null);

    if (!isFirebaseConfigured) {
      // Simulación en Modo Demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const demoUser: AuthUser = {
        uid: 'demo-google-oauth-uid',
        email: 'mario.demo@logger.com',
        displayName: 'Mario Marroquín',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'admin',
        activo: true,
        mfaVerified: false,
      };
      setUser(demoUser);
      localStorage.setItem('rfid_demo_user', JSON.stringify(demoUser));
      setLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await checkWhitelistAndSetUser(result.user);
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Ocurrió un error al iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = async () => {
    setLoading(true);
    setError(null);
    setUnauthorizedUser(null);

    if (!isFirebaseConfigured) {
      // Simulación en Modo Demo
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const demoUser: AuthUser = {
        uid: 'demo-github-oauth-uid',
        email: 'github.user@logger.com',
        displayName: 'Github Tester',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        role: 'viewer',
        activo: true,
        mfaVerified: false,
      };
      setUser(demoUser);
      localStorage.setItem('rfid_demo_user', JSON.stringify(demoUser));
      setLoading(false);
      return;
    }

    try {
      const provider = new GithubAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await checkWhitelistAndSetUser(result.user);
      }
    } catch (err: any) {
      console.error('Github Auth Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Ocurrió un error al iniciar sesión con GitHub.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      // Logout en Modo Demo
      setUser(null);
      localStorage.removeItem('rfid_demo_user');
      setLoading(false);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
      setUnauthorizedUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);
  const clearUnauthorizedUser = () => setUnauthorizedUser(null);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    unauthorizedUser,
    loginWithGoogle,
    loginWithGithub,
    logout,
    clearError,
    clearUnauthorizedUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}
