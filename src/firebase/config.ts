// ============================================================
// firebase/config.ts
// Inicialización de Firebase App y exportación del db ref
// ============================================================
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Verifica si Firebase tiene las credenciales mínimas configuradas */
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId
);

// Usar credenciales reales o un fallback inocuo para evitar que getDatabase() truene en la carga de módulos
const finalConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: "dummy-key",
      authDomain: "dummy-project.firebaseapp.com",
      databaseURL: "https://dummy-project-default-rtdb.firebaseio.com",
      projectId: "dummy-project",
      storageBucket: "dummy-project.appspot.com",
      messagingSenderId: "12345",
      appId: "1:12345:web:dummy",
    };

const app = initializeApp(finalConfig);

/** Instancia de Realtime Database */
export const db = getDatabase(app);

/** Instancia de Firebase Auth */
export const auth = getAuth(app);

