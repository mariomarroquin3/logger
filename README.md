# Sistema de Control de Acceso con RFID, ESP32 y React

Este proyecto implementa un sistema de control de acceso completo, combinando hardware (ESP32 y lector RFID) con un frontend web moderno (React, Vite, TypeScript) y Firebase como base de datos en tiempo real. 

## 🏗️ Arquitectura del Sistema

La arquitectura está diseñada para funcionar de forma descentralizada y en tiempo real, conectando el hardware directamente a Firebase y al navegador web de forma simultánea.

### 1. Hardware (C++ / ESP32)
El corazón de la capa física es un microcontrolador **ESP32** programado en C++ (Arduino Core) que gestiona:
- **Conectividad:** Se conecta a la red WiFi y sincroniza la hora local usando un servidor NTP.
- **Lector RFID (MFRC522):** Lee el UID de las tarjetas y lo procesa de manera continua.
- **Validación Autónoma:** Se conecta directamente a la API REST de Firebase Realtime Database mediante peticiones HTTPS seguras para verificar la existencia del usuario en `usuarios_autorizados/<UID>.json`.
- **Registro de Eventos:** Si se detecta una lectura, sube el resultado a Firebase en el nodo `eventos_acceso.json` (sea acceso permitido, denegado o inconsistente).
- **Actuadores (Servomotores):** Controla barreras físicas mediante dos servomotores (uno de entrada y uno de salida), abriendo y cerrando las barreras según la validación en Firebase.
- **Comunicación Web Serial:** Permite enviar comandos como `"REGISTRO"`, `"2"` (Lectura Manual) o `"3"` (Cambio de Modo) desde el Frontend a través del puerto Serial (USB). Recibe mensajes de estado y UIDs de registro para pasarlos al sistema.

### 2. Frontend (React / TypeScript / Vite)
El Dashboard web proporciona la interfaz de recepción, administración y monitoreo en tiempo real, sin usar un backend tradicional.
- **Pantalla de Recepción Pública:** Escucha los mensajes provenientes del ESP32 mediante **Web Serial API** para mostrar si el lector se encuentra conectado y listo.
- **Control y Monitoreo:** El Panel de Control (Dashboard) permite visualizar todos los eventos de acceso en tiempo real y métricas al estar suscrito activamente a los nodos de Firebase (`onValue`).
- **Administración de Estación RFID:** Mediante la Web Serial API, el administrador puede iniciar el flujo de "Registrar Credencial". El ESP32 lee la tarjeta y devuelve el comando `UID_REGISTER|XXXXX` al Frontend para que éste pueda asociarlo con un nuevo usuario sin escribir el código manualmente.

### 3. Base de Datos (Firebase Realtime Database)
Estructura principal:
- `/usuarios_autorizados`: Guarda el UID de la tarjeta como llave primaria. Contiene el estado de presencia actual (`dentro`), si el acceso está `activo` y el `nombre` del portador.
- `/eventos_acceso`: Historial cronológico inmutable de accesos, conteniendo UID, nombre, fecha, hora, tipo (entrada/salida) y el resultado (permitido, denegado, inconsistente).
- `/estado_maqueta`: Almacena el estado actual en tiempo real de los componentes físicos (por ejemplo si la puerta está abierta).

## 🚀 Guía de Instalación y Uso

### Prerrequisitos
- Node.js (v18+ recomendado)
- Placa ESP32 y componentes electrónicos (RFID-RC522, 2 Servos)
- Cuenta en Firebase con Realtime Database configurada.
- Navegador basado en Chromium (Google Chrome, Microsoft Edge) compatible con **Web Serial API**.

### 1. Configuración del Hardware (ESP32)

**Conexiones MFRC522:**
- SDA (SS) -> GPIO 5
- SCK -> GPIO 18
- MOSI -> GPIO 23
- MISO -> GPIO 19
- RST -> GPIO 21

**Servomotores:**
- Servo Entrada -> GPIO 27
- Servo Salida -> GPIO 14

**Flasheo del ESP32:**
1. Abre el archivo `esp_code/esp_code.ino` en el IDE de Arduino.
2. Instala las librerías necesarias (`MFRC522`, `ESP32Servo`, `ArduinoJson`).
3. Configura las credenciales WiFi: variables `ssid` y `password`.
4. Configura la URL de tu base de datos Firebase: `firebaseUrl`.
5. Compila y sube el código a tu ESP32.

### 2. Configuración del Frontend

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Configura Firebase: Asegúrate de configurar tus variables de entorno (como en `src/firebase/config.ts`).
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### 3. Flujo de Trabajo (Estación RFID)

1. Abre el sistema en Google Chrome o Edge.
2. Ingresa a la sección "Estación RFID" en el Dashboard.
3. Haz clic en **Conectar ESP32**. Se abrirá el modal de tu navegador para seleccionar el puerto COM (por ejemplo `COM3` o `/dev/ttyUSB0`) de la placa ESP32.
4. Para **registrar una credencial nueva**:
   - Clic en el botón "Registrar Credencial".
   - El Frontend enviará el comando serial `REGISTRO`.
   - Acerca la nueva tarjeta al lector. El ESP32 enviará de vuelta el texto `UID_REGISTER|UID_DE_LA_TARJETA`.
   - El sistema capturará ese texto, lo aislará y abrirá el formulario para asignarlo directamente a una persona.

## 🛠️ Tecnologías Principales
- **React 19** + **TypeScript** + **Vite**
- **TailwindCSS** (Estilos y responsividad UI)
- **Firebase SDK** (Autenticación y bases de datos NoSQL RTDB)
- **Web Serial API** (`navigator.serial` para controlar el hardware y recibir lectura de tarjetas por USB)
- **Lucide React** (Iconografía)
- **Recharts** (Gráficos analíticos)
- **ESP32 Arduino Core** (C++ embebido y HTTP Client)

## 📁 Estructura del Proyecto

* `esp_code/`: Código fuente C++ para flashear el ESP32, gestión de servos y validaciones HTTPS.
* `src/context/`: Contextos globales (SerialContext, AuthContext, DashboardContext).
* `src/components/`: Componentes reutilizables UI (Modales de conexión, Gráficas, Eventos).
* `src/pages/`: Pantallas principales de la aplicación:
  - `ReceptionPage.tsx`: Pantalla pública para visualizar la conexión actual.
  - `admin/EstacionRfidPage.tsx`: Conexión de puertos seriales y registro de usuarios.
  - `EventsPage.tsx` / `DashboardPage.tsx`: Vistas analíticas y de monitoreo.
* `src/hooks/`: Hooks personalizados de suscripciones a RTDB y lógica de negocios.
* `src/firebase/`: Configuración y utilidades de base de datos.
