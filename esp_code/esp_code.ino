#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <time.h> 
#include <ArduinoJson.h> 


const char* ssid = "EducacionSV";
const char* password = "Aprender!_sv";
const String firebaseUrl = "https://access-log-c7bd1-default-rtdb.firebaseio.com/";


Servo servoEntrada;
Servo servoSalida;

const int pinServoEntrada = 27; 
const int pinServoSalida = 14;  

const int tiempoGiro = 400;   
const int velocidadAbrir = 120;
const int velocidadCerrar = 70;


const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = -21600; 
const int   daylightOffset_sec = 0;

#define SS_PIN    5   
#define RST_PIN   21  

MFRC522 mfrc522(SS_PIN, RST_PIN);
String inputData = ""; 
String modoActual = "entrada"; 


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

  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[OK] WiFi conectado con éxito.");


  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("[OK] Reloj sincronizado con servidor NTP.");


  Serial.println("Inicializando RC522...");
  SPI.begin(18, 19, 23, SS_PIN);
  mfrc522.PCD_Init();
  Serial.println("[OK] RFID RC522 listo en GPIO 26");
}

void loop() {
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


  if (Serial.available() > 0) {
    String lineaRecibida = Serial.readStringUntil('\n');
    lineaRecibida.trim();

    if (lineaRecibida == "REGISTRO") {
      registrarCredencial();
      ultimoMenu = 0;
    }
    else if (lineaRecibida == "1") {
      escribirDatos();

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

      delay(1000);
      ultimoMenu = 0;
    }
    else if (lineaRecibida == "4") {
      Serial.println("[DEBUG] Activando modo registro...");
      registrarCredencial();
      ultimoMenu = 0;
    }
  }

  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    Serial.println("[ESP32] Lectura iniciada");
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
  
  delay(100);
}

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
  
  
  for (int i = 0; i < 16; i++) {
    buffer[i] = ' '; 
  }
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

void leerDatosYEnviar() {
  Serial.println("\nAcerca la tarjeta al lector para registrar " + modoActual + "...");
  
  while (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) { }

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
                 

  procesarAccesoFirebase(uidLeido, modoActual);
}


void procesarAccesoFirebase(String uid, String tipoAcceso) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi desconectado.");
    delay(2000);
    return;
  }

  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure(); 
  HTTPClient http;


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

  if (payload == "null") {
    Serial.println("[DENEGADO] UID no reconocido en la base de datos.");    
    registrarEventoFisico(uid, "Desconocido", tipoAcceso, "denegado");
    delay(3000);
   
    return;
  }

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

  Serial.println("[CONCEDIDO] Acceso validado para: " + nombreUsuario);



  bool nuevoEstado = (tipoAcceso == "entrada");
  actualizarPresenciaFisico(uid, nuevoEstado);

  registrarEventoFisico(uid, nombreUsuario, tipoAcceso, "permitido");

  actualizarEstadoMaquetaFisico(true); 

  if (tipoAcceso == "entrada") {
    cicloPuerta(servoEntrada, "Acceso de ENTRADA concedido");
  } else {
    cicloPuerta(servoSalida, "Acceso de SALIDA concedido");
  }

  actualizarEstadoMaquetaFisico(false); 
}


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

  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("[ERROR] No se pudo obtener la hora del sistema.");
    return;
  }
  
  char fechaStr[11];
  strftime(fechaStr, sizeof(fechaStr), "%Y-%m-%d", &timeinfo);
  
  char horaStr[9];
  strftime(horaStr, sizeof(horaStr), "%H:%M:%S", &timeinfo);
  
  time_t now;
  time(&now);

  WiFiClientSecure clienteSeguro;
  clienteSeguro.setInsecure(); 

  HTTPClient http;
  String url = firebaseUrl + "eventos_acceso.json";
  http.begin(clienteSeguro, url);
  http.addHeader("Content-Type", "application/json");

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

void registrarCredencial() {
  Serial.println("\n[MODO REGISTRO] Esperando tarjeta para registrar UID...");
  
  int timeout = 0;
  while (timeout < 300) {
    if (Serial.available()) {
      String cmd = Serial.readStringUntil('\n');
      cmd.trim();
      if (cmd == "CANCELAR") {
        Serial.println("[REGISTRO] Cancelado por comando.");
        return;
      }
    }

    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      String uidLeido = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        uidLeido += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        uidLeido += String(mfrc522.uid.uidByte[i], HEX);
      }
      uidLeido.toUpperCase();
      
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();

      Serial.println("UID_REGISTER|" + uidLeido);

      
      delay(2000);
      return; 
    }

    delay(100);
    timeout++;
  }
  Serial.println("[REGISTRO] Timeout. No se detectó tarjeta.");
}