// ============================================================
// auth/AuthContext.tsx
// Contexto de Autenticación: OAuth Google + Email/Password
// Whitelist en RTDB (usuarios_dashboard/{uid})
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
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';

import { auth, db, isFirebaseConfigured } from '../firebase/config';
import type { AuthUser, DashboardUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  dashboardUser: DashboardUser | null;
  loading: boolean;
  error: string | null;
  unauthorizedUser: { uid: string; email: string | null } | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
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
  const [dashboardUser, setDashboardUser] = useState<DashboardUser | null>(null);
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
        setError('Acceso denegado: Su cuenta no está registrada en el dashboard.');
        setUser(null);
        setDashboardUser(null);
        return false;
      }

      const data = snapshot.val() as DashboardUser;
      if (data.activo !== true) {
        setUnauthorizedUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        await signOut(auth);
        setError('Acceso denegado: Su cuenta se encuentra actualmente desactivada.');
        setUser(null);
        setDashboardUser(null);
        return false;
      }

      // Usuario autorizado
      const authUser: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.nombre || firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        role: data.rol || 'viewer',
        activo: true,
        mfaVerified: false,
      };

      setUser(authUser);
      setDashboardUser(data);
      setError(null);
      setUnauthorizedUser(null);
      return true;
    } catch (err: unknown) {
      console.error('Error al consultar whitelist:', err);
      await signOut(auth);
      setError('Error al verificar los permisos en la base de datos.');
      setUser(null);
      setDashboardUser(null);
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
        setDashboardUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Google OAuth ───────────────────────────────────────────
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
        displayName: 'Mario Demo',
        photoURL: null,
        role: 'admin',
        activo: true,
        mfaVerified: false,
      };
      const demoDashboardUser: DashboardUser = {
        activo: true,
        email: 'mario.demo@logger.com',
        nombre: 'Mario Demo',
        rol: 'admin',
      };
      setUser(demoUser);
      setDashboardUser(demoDashboardUser);
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
    } catch (err: unknown) {
      console.error('Google Auth Error:', err);
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code !== 'auth/popup-closed-by-user') {
        setError('Ocurrió un error al iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Email / Password ───────────────────────────────────────
  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    setUnauthorizedUser(null);

    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const demoUser: AuthUser = {
        uid: 'demo-email-uid',
        email,
        displayName: email.split('@')[0],
        photoURL: null,
        role: 'viewer',
        activo: true,
        mfaVerified: false,
      };
      const demoDashboardUser: DashboardUser = {
        activo: true,
        email,
        nombre: email.split('@')[0],
        rol: 'viewer',
      };
      setUser(demoUser);
      setDashboardUser(demoDashboardUser);
      localStorage.setItem('rfid_demo_user', JSON.stringify(demoUser));
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        await checkWhitelistAndSetUser(result.user);
      }
    } catch (err: unknown) {
      console.error('Email Auth Error:', err);
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
        setError('Correo electrónico o contraseña incorrectos.');
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Por favor intente más tarde.');
      } else {
        setError('Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Logout ─────────────────────────────────────────────────
  const logout = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      setUser(null);
      setDashboardUser(null);
      localStorage.removeItem('rfid_demo_user');
      setLoading(false);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
      setDashboardUser(null);
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
    dashboardUser,
    loading,
    error,
    unauthorizedUser,
    loginWithGoogle,
    loginWithEmail,
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
