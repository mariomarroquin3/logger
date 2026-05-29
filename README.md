# RFID Access Control Dashboard

Dashboard web en tiempo real para monitorear un sistema de control de acceso RFID basado en ESP32 + Firebase Realtime Database.

## Stack

- **React 18** + **Vite** + **TypeScript**
- **Tailwind CSS** — dark mode profesional
- **Firebase Realtime Database** — listeners en tiempo real
- **Recharts** — gráficas de accesos
- **React Router v6** — navegación SPA

---

## Configuración de Firebase

### 1. Copia el archivo de entorno

```bash
cp .env.example .env
```

### 2. Rellena tus credenciales

Abre `.env` y pega los valores desde [Firebase Console](https://console.firebase.google.com) → tu proyecto → Configuración del proyecto → Tus apps.

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Reglas de Realtime Database (desarrollo)

En Firebase Console → Realtime Database → Reglas:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> ⚠️ **Importante:** Antes de producción, asegurar las reglas con autenticación.

---

## Instalación y arranque

```bash
npm install
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## Estructura Firebase esperada

```json
{
  "usuarios_autorizados": {
    "A1B2C3D4": {
      "nombre": "Mario",
      "activo": true,
      "dentro": true
    }
  },
  "eventos_acceso": {
    "-Nx001": {
      "uid": "A1B2C3D4",
      "nombre": "Mario",
      "tipo": "entrada",
      "resultado": "permitido",
      "timestamp": "2026-05-27T20:15:21Z"
    }
  },
  "estado_maqueta": {
    "puerta_abierta": true,
    "alarma_activa": false
  }
}
```

---

## Páginas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard principal — KPI cards + estado en tiempo real |
| `/eventos` | Historial de accesos con búsqueda y filtros |
| `/graficas` | Gráficas de accesos por hora, entradas/salidas y top usuarios |
| `/presencia` | Usuarios actualmente dentro del establecimiento |

---

## Arquitectura

```
src/
├── auth/           # Stubs para Firebase Auth futura (RBAC listo)
├── components/     # Componentes reutilizables por dominio
├── context/        # DashboardProvider — 1 listener por recurso Firebase
├── firebase/       # Config + queries optimizadas (limitToLast 200)
├── layouts/        # AppLayout con Sidebar + TopBar
├── pages/          # Una página por ruta
├── services/       # dataTransformer: raw -> typed -> analytics
└── types/          # Interfaces TypeScript con IDs de Firebase
```

---

## Características técnicas

- **Un listener por recurso** — DashboardProvider evita listeners duplicados
- **limitToLast(200)** en eventos — sin descargar datasets enormes
- **useMemo** para derived state — sin recalcular en cada render
- **Toast notifications** — alerta visual al llegar nuevo evento
- **Loading / Empty / Error** — cada página maneja los 3 estados
- **Cleanup automático** — listeners cerrados al desmontar componentes
