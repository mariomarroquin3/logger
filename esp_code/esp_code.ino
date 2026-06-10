#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <time.h> // Librería para obtener la hora real de internet
#include <ArduinoJson.h> // LIBRERÍA AGREGADA PARA PARSEO RELACIONAL

// ===============================
// CONFIGURACIÓN WIFI Y FIREBASE
// ===============================
const char* ssid = "EducacionSV";
const char* password = "Aprender!_sv";
const String firebaseUrl = "https://access-log-c7bd1-default-rtdb.firebaseio.com/";

// ===============================
// CONFIGURACIÓN SERVOS CONTINUOS
// ===============================
Servo servoEntrada;
Servo servoSalida;

const int pinServoEntrada = 27; 
const int pinServoSalida = 14;  

const int tiempoGiro = 400;   
const int velocidadAbrir = 110; 
const int velocidadCerrar = 70; 

// ===============================
// CONFIGURACIÓN DE HORA (NTP)
// ===============================
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = -21600; // Ajuste para Centroamérica (UTC-6)
const int   daylightOffset_sec = 0;

// ===============================
// CONFIGURACIÓN RFID
// ===============================
#define SS_PIN    5   
#define RST_PIN   21  
#define pinBuzzer 4

MFRC522 mfrc522(SS_PIN, RST_PIN);
String inputData = ""; 
String modoActual = "entrada"; 

// ===============================
// PROTOTIPO DE FUNCIONES
// ===============================
void registrarCredencial();
void leerDatosYEnviar();
void escribirDatos();

void setup() {
  Serial.begin(115200);
  while (!Serial); 
  delay(1000);

  Serial.println("\n======================================");
  Serial.println("  SISTEMA: RFID + FIREBASE + SERVOS   ");
  Serial.println("======================================");

  // 1. Inicializar Servos
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1); 
  
  servoEntrada.setPeriodHertz(50);
  servoSalida.setPeriodHertz(50);
  
  servoEntrada.attach(pinServoEntrada, 500, 2400); 
  servoSalida.attach(pinServoSalida, 500, 2400); 
  
  servoEntrada.write(90); 
  servoSalida.write(90); 
  delay(1000);
  Serial.println("[OK] Servos inicializados (Pines 12 y 13)");

  // 2. Inicializar WiFi
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[OK] WiFi conectado con éxito.");

  // 3. Sincronizar Reloj por Internet (NTP)
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("[OK] Reloj sincronizado con servidor NTP.");

  // 4. Inicializar bus SPI y Lector RFID
  Serial.println("Inicializando RC522...");
  SPI.begin(18, 19, 23, SS_PIN);
  mfrc522.PCD_Init();
  Serial.println("[OK] RFID RC522 listo en GPIO 26");

}

void loop() {
  // 1. Mostrar menú solo periódicamente o cuando se requiera para evitar saturar el Serial
  static unsigned long ultimoMenu = 0;
  if (millis() - ultimoMenu > 1000 || ultimoMenu == 0) {
    Serial.println("\nMENU PRINCIPAL (POLLEO ACTIVO):");
    Serial.println("1. Escribir en tarjeta");
    Serial.print("2. Leer tarjeta manualmente (Modo actual: ");
    Serial.print(modoActual);
    Serial.println(")");
    Serial.println("3. Cambiar modo (Entrada <-> Salida)");
    Serial.println("4. Registrar credencial (debug)");
    Serial.println("Cmd: REGISTRO (activacion Web Serial)");
    ultimoMenu = millis();
  }

  // 2. Procesar comandos entrantes de forma no bloqueante
  if (Serial.available() > 0) {
    String lineaRecibida = Serial.readStringUntil('\n');
    lineaRecibida.trim();

    if (lineaRecibida == "REGISTRO") {
      registrarCredencial();
      ultimoMenu = 0;
    }
    else if (lineaRecibida == "1") {
      escribirDatos();
      actualizarPantallaBase();
      ultimoMenu = 0;
    }
    else if (lineaRecibida == "2") {
      Serial.println("[ESP32] Lectura iniciada");
      leerDatosYEnviar();
      ultimoMenu = 0;
    }
    else if (lineaRecibida == "3") {
      modoActual = (modoActual == "entrada") ? "salida" : "entrada";
      Serial.println("\n[MODO CAMBIADO] Ahora el sistema registrará: " + modoActual);
      actualizarPantallaBase();
      delay(1000);
      ultimoMenu = 0;
    }
    else if (lineaRecibida == "4") {
      Serial.println("[DEBUG] Activando modo registro...");
      registrarCredencial();
      ultimoMenu = 0;
    }
  }

  // 3. Polleo automático: Si se acerca una tarjeta, leerla inmediatamente
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    Serial.println("[ESP32] Lectura iniciada");
    // Extraer el UID y procesar la tarjeta
    String uidLeido = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uidLeido += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uidLeido += String(mfrc522.uid.uidByte[i], HEX);
    }
    uidLeido.toUpperCase();
    
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    Serial.println("-------------------------");
    Serial.println("UID LEIDO (AUTO): " + uidLeido);
    Serial.println("-------------------------");

    procesarAccesoFirebase(uidLeido, modoActual);
    ultimoMenu = 0;
  }
  
  delay(100); // Pequeño delay de cortesía para no saturar el procesador
}

// =================================================================
// FUNCIÓN REUTILIZABLE DE PUERTAS
// =================================================================
void cicloPuerta(Servo &servoActivo, String mensajeAcceso) {
  Serial.println("\n[ AUTORIZADO ] " + mensajeAcceso);

  
  Serial.println(" -> Abriendo barrera...");
  servoActivo.write(velocidadAbrir); 
  delay(tiempoGiro); 
  Serial.println(" -> Barrera abierta. Puede pasar.");
  servoActivo.write(90); 
  delay(3000);       
  Serial.println(" -> Cerrando barrera...");  
  servoActivo.write(velocidadCerrar); 
  delay(tiempoGiro); 
  servoActivo.write(90); 
  Serial.println(" -> Barrera asegurada.");
  
}

// ===============================
// FUNCIÓN 1: ESCRIBIR DATOS (NO MODIFICADA)
// ===============================
void escribirDatos() {
  Serial.println("\nIngrese el nombre (max 15 caracteres, finalice con '#' ):");
  inputData = "";
  bool finalizado = false;

  while (!finalizado) {
    if (Serial.available()) {
      char c = Serial.read();
      if (c == '#') {
        finalizado = true;
      } else {
        if (inputData.length() < 15) {
          inputData += c;
        }
      }
    }
  }
  
  Serial.print("Preparando para guardar: [");
  Serial.print(inputData);
  Serial.println("]");
  Serial.println("Acerca la tarjeta al lector para escribir...");


  while (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) { }
  
  byte block = 1; 
  byte buffer[16];
  
  // LLENAR CON ESPACIOS EN BLANCO PARA BORRAR BASURA PREVIA
  for (int i = 0; i < 16; i++) {
    buffer[i] = ' '; 
  }
  // COPIAR EL NOMBRE
  for (int i = 0; i < inputData.length(); i++) {
    buffer[i] = inputData.charAt(i);
  }
  
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) { key.keyByte[i] = 0xFF; }
  
  MFRC522::StatusCode status;
  status = mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, block, &key, &(mfrc522.uid));
  if (status != MFRC522::STATUS_OK) {
    Serial.println("Error en autenticacion.");
    delay(2000);
    mfrc522.PICC_HaltA();
    return;
  }
  
  status = mfrc522.MIFARE_Write(block, buffer, 16);
  if (status == MFRC522::STATUS_OK) {
    delay(2000);
  }
  
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(3000);
}

// ===============================
// FUNCIÓN 2: LEER (REFACTORIZADA - SOLO UID)
// ===============================
void leerDatosYEnviar() {
  Serial.println("\nAcerca la tarjeta al lector para registrar " + modoActual + "...");
  
  while (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) { }

  // 1. EXTRAER SÓLO EL UID
  String uidLeido = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uidLeido += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    uidLeido += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidLeido.toUpperCase();
  
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  Serial.println("-------------------------");
  Serial.println("UID LEIDO: " + uidLeido);
  Serial.println("-------------------------");
                 
  // 2. PROCESAR ACCESO RELACIONAL EN FIREBASE
  procesarAccesoFirebase(uidLeido, modoActual);
}

// =================================================================
// LÓGICA RELACIONAL JSON FIREBASE (ESTILO WOKWI)
// =================================================================
void procesarAccesoFirebase(String uid, String tipoAcceso) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi desconectado.");
    delay(2000);
    return;
  }

  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure(); 
  HTTPClient http;

  // 1. OBTENER INFORMACIÓN DEL USUARIO (GET)
  String urlConsulta = firebaseUrl + "usuarios_autorizados/" + uid + ".json";
  http.begin(clienteSeguro, urlConsulta);
  int httpCode = http.GET();
  String payload = http.getString();
  http.end();

  if (httpCode <= 0) {
    Serial.println("[ERROR HTTP] " + http.errorToString(httpCode));
    delay(2000);
    return;
  }

  // 2. VALIDAR SI EL USUARIO EXISTE
  if (payload == "null") {
    Serial.println("[DENEGADO] UID no reconocido en la base de datos.");    
    registrarEventoFisico(uid, "Desconocido", tipoAcceso, "denegado");
    delay(3000);
   
    return;
  }

  // 3. EXTRAER DATOS CON JSON
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload);

  String nombreUsuario = "Usuario";
  bool activo = true;
  bool dentro = false;

  if (!error) {
    nombreUsuario = doc["nombre"] | "Usuario";
    activo = doc["activo"] | true;
    dentro = doc["dentro"] | false;
  }

  // 4. LÓGICA DE NEGOCIO (DENEGACIONES)
  if (!activo) {
    Serial.println("[DENEGADO] Usuario bloqueado: " + nombreUsuario);
    registrarEventoFisico(uid, nombreUsuario, tipoAcceso, "denegado");
    delay(3000);
   
    return;
  }

  if (tipoAcceso == "entrada" && dentro) {
    Serial.println("[ERROR] El usuario ya se encuentra adentro.");
    registrarEventoFisico(uid, nombreUsuario, tipoAcceso, "inconsistente");
    delay(3000);
    return;
  }

  if (tipoAcceso == "salida" && !dentro) {
    Serial.println("[ERROR] No se registro entrada previa para este usuario.");
    registrarEventoFisico(uid, nombreUsuario, tipoAcceso, "inconsistente");
    delay(3000);

    return;
  }

  // 5. ACCESO CONCEDIDO
  Serial.println("[CONCEDIDO] Acceso validado para: " + nombreUsuario);


  // --- Actualizar Presencia en BD ---
  bool nuevoEstado = (tipoAcceso == "entrada");
  actualizarPresenciaFisico(uid, nuevoEstado);

  // --- Log de Acceso ---
  registrarEventoFisico(uid, nombreUsuario, tipoAcceso, "permitido");


  // --- Acciones de Puerta y Maqueta ---
  actualizarEstadoMaquetaFisico(true); 

  if (tipoAcceso == "entrada") {
    cicloPuerta(servoEntrada, "Acceso de ENTRADA concedido");
  } else {
    cicloPuerta(servoSalida, "Acceso de SALIDA concedido");
  }

  actualizarEstadoMaquetaFisico(false); 
}

// ===============================
// PETICIONES FIREBASE AUXILIARES
// ===============================

void actualizarPresenciaFisico(String uid, bool dentro) {
  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure(); 
  HTTPClient http;

  String url = firebaseUrl + "usuarios_autorizados/" + uid + ".json";
  http.begin(clienteSeguro, url);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"dentro\":" + String(dentro ? "true" : "false") + "}";

  int httpCode = http.sendRequest("PATCH", payload);
  Serial.println("[BD] Presencia actualizada (PATCH): " + String(httpCode));
  
  http.end();
}

void actualizarEstadoMaquetaFisico(bool puertaAbierta) {
  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure(); 
  HTTPClient http;

  String url = firebaseUrl + "estado_maqueta.json";
  http.begin(clienteSeguro, url);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"puerta_abierta\":" + String(puertaAbierta ? "true" : "false") + ",\"alarma_activa\":false}";

  int httpCode = http.sendRequest("PATCH", payload);
  Serial.println("[BD] Estado maqueta actualizado (PATCH): " + String(httpCode));
  
  http.end();
}

void registrarEventoFisico(String uid, String nombre, String tipo, String resultado) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi desconectado.");
    return;
  }

  // OBTENER LA HORA ACTUAL
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("[ERROR] No se pudo obtener la hora del sistema.");
    return;
  }
  
  // Formatear Fecha (YYYY-MM-DD)
  char fechaStr[11];
  strftime(fechaStr, sizeof(fechaStr), "%Y-%m-%d", &timeinfo);
  
  // Formatear Hora (HH:MM:SS)
  char horaStr[9];
  strftime(horaStr, sizeof(horaStr), "%H:%M:%S", &timeinfo);
  
  // Obtener Timestamp exacto
  time_t now;
  time(&now);

  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure(); 

  HTTPClient http;
  String url = firebaseUrl + "eventos_acceso.json";
  http.begin(clienteSeguro, url);
  http.addHeader("Content-Type", "application/json");

  // CREAMOS EL JSON EXACTAMENTE IGUAL A TU IMAGEN 1
  String payload = "{"
                   "\"fecha\":\"" + String(fechaStr) + "\","
                   "\"hora\":\"" + String(horaStr) + "\","
                   "\"nombre\":\"" + nombre + "\","
                   "\"resultado\":\"" + resultado + "\","
                   "\"timestamp\":" + String(now) + ","
                   "\"tipo\":\"" + tipo + "\","
                   "\"uid\":\"" + uid + "\""
                   "}";

  Serial.println("[FIREBASE] Enviando JSON al log de eventos:");
  Serial.println(payload);
  
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.println("[FIREBASE] OK. Registro guardado."); 
  } else {
    Serial.print("[FIREBASE ERROR] ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}


// =================================================================
// MODO REGISTRO — activado por comando REGISTRO vía Web Serial
// NO registra evento, NO abre puerta, NO modifica Firebase.
// Solo lee UID y emite: UID_REGISTER|XXXXXXXX
// =================================================================
void registrarCredencial() {
  Serial.println("\n[MODO REGISTRO] Esperando tarjeta para registrar UID...");
  

  // Timeout: ~30 segundos (300 iteraciones x 100ms)
  int timeout = 0;
  while (timeout < 300) {
    // Verificar si llega cancelación por Serial (comando CANCELAR)
    if (Serial.available()) {
      String cmd = Serial.readStringUntil('\n');
      cmd.trim();
      if (cmd == "CANCELAR") {
        Serial.println("[REGISTRO] Cancelado por comando.");
        return;
      }
    }

    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      // Tarjeta detectada
      String uidLeido = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        uidLeido += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        uidLeido += String(mfrc522.uid.uidByte[i], HEX);
      }
      uidLeido.toUpperCase();
      
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();

      // Emitir protocolo hacia la aplicación React
      Serial.println("UID_REGISTER|" + uidLeido);

      
      delay(2000);
      return; // Volver al loop principal
    }

    delay(100);
    timeout++;
  }

  // Timeout alcanzado sin detectar tarjeta
  Serial.println("[REGISTRO] Timeout. No se detectó tarjeta.");
}