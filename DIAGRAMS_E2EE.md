# Diagramas Visuales - Sistema de Cifrado ChatterBox
---

## 1. Arquitectura General del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CHATTERBOX E2EE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌──────────────┐                              ┌──────────────┐    │
│   │  Usuario A   │                              │  Usuario B   │    │
│   │   (React)    │                              │   (React)    │    │
│   └──────┬───────┘                              └──────┬───────┘    │
│          │                                              │            │
│          │  1. Login (email + password)                │            │
│          ├─────────────────┐        ┌─────────────────┤            │
│          │                 ▼        ▼                 │            │
│          │         ┌─────────────────┐                │            │
│          │         │  Backend API    │                │            │
│          │         │  (Node.js)      │                │            │
│          │         ├─────────────────┤                │            │
│          │         │ • bcrypt hash   │                │            │
│          │         │ • JWT sign      │                │            │
│          │         │ • ECDH server   │                │            │
│          │         └────────┬────────┘                │            │
│          │                  │                         │            │
│          │  2. JWT Token    │                         │            │
│          │◄─────────────────┘                         │            │
│          │                                            │            │
│          │                                            │            │
│          │  3. Generar claves ECDH                   │            │
│          ├──► Privada A (local)                      │            │
│          ├──► Pública A                              │            │
│          │      │                                     │            │
│          │      │ 4. Enviar pública                  │            │
│          │      └────────────┐    ┌─────────────────┘            │
│          │                   ▼    ▼                               │
│          │            ┌──────────────────┐                        │
│          │            │    MongoDB       │                        │
│          │            │ ┌──────────────┐ │                        │
│          │            │ │ User A       │ │                        │
│          │            │ │ publicKey: X │ │                        │
│          │            │ ├──────────────┤ │                        │
│          │            │ │ User B       │ │                        │
│          │            │ │ publicKey: Y │ │                        │
│          │            │ └──────────────┘ │                        │
│          │            └────────┬─────────┘                        │
│          │                     │                                   │
│          │  5. Obtener pública B                                  │
│          │◄────────────────────┘                                  │
│          │                                                         │
│          │  6. Calcular clave compartida                          │
│          │     DH(Privada A, Pública B) = Shared Key              │
│          │                                                         │
│          │  7. Mensaje: "Hola"                                    │
│          │     ↓                                                  │
│          │  8. Cifrar con AES-256-GCM                            │
│          │     Resultado: "xK9p...7bY"                            │
│          │     ↓                                                  │
│          │  9. Enviar a Stream Chat                              │
│          ├────────────────────┐                                   │
│          │                    ▼                                   │
│          │             ┌──────────────┐                           │
│          │             │ Stream Chat  │                           │
│          │             │ (cifrado)    │                           │
│          │             └──────┬───────┘                           │
│          │                    │                                   │
│          │                    │ 10. Notificar Usuario B          │
│          │                    └───────────────────┐              │
│          │                                        ▼              │
│          │                              11. Recibir cifrado      │
│          │                                  "xK9p...7bY"         │
│          │                                        │              │
│          │                              12. Descifrar con        │
│          │                                  DH(Privada B, Pública A)
│          │                                        │              │
│          │                              13. Mostrar: "Hola"      │
│          │                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo de Diffie-Hellman (Intercambio de Claves)

```
┌───────────────────────────────────────────────────────────────────┐
│              DIFFIE-HELLMAN KEY EXCHANGE (ECDH)                   │
└───────────────────────────────────────────────────────────────────┘

USUARIO A                           USUARIO B
─────────                           ─────────

Generar claves                   Generar claves
   ┌──────────────┐                    ┌──────────────┐
   │ Privada A    │                    │ Privada B    │
   │ (SECRETA)    │                    │ (SECRETA)    │
   └──────────────┘                    └──────────────┘
   ┌──────────────┐                    ┌──────────────┐
   │ Pública A    │                    │ Pública B    │
   └──────┬───────┘                    └──────┬───────┘
          │                                    │
          │                                    │
Intercambio de claves PÚBLICAS              │
          │                                    │
          └──────────────┐   ┌────────────────┘
                         │   │
                         ▼   ▼
                    ┌─────────────┐
                    │   Internet  │
                    │  (Público)  │
                    └─────────────┘
                         │   │
          ┌──────────────┘   └────────────────┐
          │                                    │
          ▼                                    ▼
   ┌──────────────┐                    ┌──────────────┐
   │ Pública B    │                    │ Pública A    │
   │ (recibida)   │                    │ (recibida)   │
   └──────────────┘                    └──────────────┘

Calcular clave compartida          Calcular clave compartida
   
   Shared = DH(Privada A, Pública B)   Shared = DH(Privada B, Pública A)
   
   ┌──────────────────────┐            ┌──────────────────────┐
   │  Clave Compartida    │            │  Clave Compartida    │
   │  0x3F7A...9B2C       │ ═══════════│  0x3F7A...9B2C       │
   │  (256 bits)          │  ¡IGUALES! │  (256 bits)          │
   └──────────────────────┘            └──────────────────────┘

¡Ambos tienen la MISMA clave sin haberla transmitido!

Ahora pueden cifrar mensajes con AES-256-GCM usando esta clave
```

---

## 3. Proceso de Cifrado de un Mensaje

```
┌─────────────────────────────────────────────────────────────────┐
│             CIFRADO DE MENSAJE (AES-256-GCM)                    │
└─────────────────────────────────────────────────────────────────┘

INPUT: "Hola, ¿cómo estás?"
       │
       │ 1. Convertir a bytes
       ▼
   [0x48, 0x6F, 0x6C, 0x61, ...]
       │
       │ 2. Generar IV aleatorio (12 bytes)
       ├─────► IV: [0x3A, 0x7B, 0x9C, ...]
       │
       │ 3. Usar clave compartida (256 bits)
       ├─────► Key: [0xF2, 0x8E, 0x4A, ...]
       │
       │ 4. Aplicar AES-256-GCM
       ▼
   ┌───────────────────────────────┐
   │     AES-256-GCM CIPHER        │
   ├───────────────────────────────┤
   │  • Cifra datos                │
   │  • Genera authentication tag  │
   │  • Protege integridad         │
   └──────────┬────────────────────┘
              │
              │ OUTPUT (3 componentes):
              │
              ├──► IV (12 bytes)
              │    "xK9p2vL8eH7s"
              │
              ├──► Auth Tag (16 bytes)
              │    "mN4q8zT3pR2w"
              │
              └──► Datos Cifrados
                   "7bYfG3kL9mQ..."

RESULTADO FINAL (base64):
"xK9p2vL8eH7s.mN4q8zT3pR2w.7bYfG3kL9mQ..."
        │            │            │
       IV       Auth Tag    Datos Cifrados

Este es el mensaje que se envía a través de Stream Chat
```

---

## 4. Proceso de Descifrado

```
┌─────────────────────────────────────────────────────────────────┐
│            DESCIFRADO DE MENSAJE (AES-256-GCM)                  │
└─────────────────────────────────────────────────────────────────┘

MENSAJE RECIBIDO:
"xK9p2vL8eH7s.mN4q8zT3pR2w.7bYfG3kL9mQ..."
       │
       │ 1. Separar componentes
       ▼
┌──────────────┬────────────────┬─────────────────┐
│ IV           │ Auth Tag       │ Datos Cifrados  │
│ xK9p2vL8eH7s │ mN4q8zT3pR2w   │ 7bYfG3kL9mQ...  │
└──────────────┴────────────────┴─────────────────┘
       │              │                 │
       │              │                 │
       │ 2. Usar clave compartida      │
       ├──────────────┴─────────────────┘
       │
       │ Key: [0xF2, 0x8E, 0x4A, ...]
       │
       │ 3. Verificar Auth Tag (integridad)
       ▼
   ┌───────────────────────────────┐
   │   ¿Mensaje modificado?        │
   ├───────────────────────────────┤
   │  NO  → Continuar descifrado   │──┐
   │  SÍ  → ERROR ❌               │  │
   └───────────────────────────────┘  │
                                       │
       ┌───────────────────────────────┘
       │
       │ 4. Aplicar AES-256-GCM (descifrado)
       ▼
   ┌───────────────────────────────┐
   │     AES-256-GCM DECIPHER      │
   ├───────────────────────────────┤
   │  • Descifra datos             │
   │  • Verifica autenticidad      │
   └──────────┬────────────────────┘
              │
              │ 5. Convertir bytes a texto
              ▼
          [0x48, 0x6F, 0x6C, 0x61, ...]
              │
              │
              ▼
OUTPUT: "Hola, ¿cómo estás?"

Mensaje descifrado correctamente
```

---

## 5. Stack Completo de Seguridad

```
┌──────────────────────────────────────────────────────────────┐
│              CAPAS DE SEGURIDAD DE CHATTERBOX                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ CAPA 7: APLICACIÓN                                           │
├──────────────────────────────────────────────────────────────┤
│   E2EE (AES-256-GCM)                                       │
│  • Mensajes cifrados punto a punto                           │
│  • Solo usuarios leen contenido                              │
│  • Auth tags detectan modificaciones                         │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ CAPA 6: INTERCAMBIO DE CLAVES                                │
├──────────────────────────────────────────────────────────────┤
│   ECDH (Elliptic Curve Diffie-Hellman)                     │
│  • Intercambio seguro sin transmitir claves                  │
│  • Curva secp256k1 (backend) / P-256 (frontend)              │
│  • Perfect Forward Secrecy                                   │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ CAPA 5: AUTENTICACIÓN                                        │
├──────────────────────────────────────────────────────────────┤
│   JWT (JSON Web Tokens)                                    │
│  • Firma digital con clave secreta                           │
│  • Expiración de 7 días                                      │
│  • Almacenado en cookies HTTP-only                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ CAPA 4: CONTRASEÑAS                                          │
├──────────────────────────────────────────────────────────────┤
│   bcrypt (Hashing)                                         │
│  • Salt automático (10 rounds)                               │
│  • One-way function (irreversible)                           │
│  • Protección contra rainbow tables                          │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ CAPA 3: COOKIES                                              │
├──────────────────────────────────────────────────────────────┤
│   Seguridad de Cookies                                     │
│  • HTTP-only (protección XSS)                                │
│  • SameSite=strict (protección CSRF)                         │
│  • Secure en producción (solo HTTPS)                         │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ CAPA 2: TRANSPORTE                                           │
├──────────────────────────────────────────────────────────────┤
│   HTTPS (TLS 1.3)                                          │
│  • Cifrado en tránsito                                       │
│  • Certificados SSL/TLS                                      │
│  • Protección contra sniffing                                │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ CAPA 1: INFRAESTRUCTURA                                      │
├──────────────────────────────────────────────────────────────┤
│   MongoDB + Stream Chat                                    │
│  • Almacenamiento cifrado                                    │
│  • Backups encriptados                                       │
│  • Firewalls y VPC                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Comparación Visual: Con vs Sin Cifrado

```
SIN CIFRADO (Inseguro) 
═══════════════════════

Usuario A ────► "Hola" ────► Servidor ────► "Hola" ────► Usuario B
                  │                              │
                  ↓                              ↓
            LEGIBLE POR:                    LEGIBLE POR:
            • Hackers                       • Administradores
            • ISP                           • Empleados
            • Gobierno                      • Hackers del servidor
            • Man-in-the-middle

═══════════════════════════════════════════════════════════════════

CON E2EE (Seguro) 
═════════════════

Usuario A ────► "Hola" ────► Cifrado local
                               │
                               ▼
                        "xK9p2vL...7bY"
                               │
                               ▼
                          Servidor
                               │
                               ↓
                        "xK9p2vL...7bY"
                        (NO PUEDE LEER)
                               │
                               ▼
                          Usuario B
                               │
                               ▼
                        Descifrado local
                               │
                               ▼
                            "Hola"

LEGIBLE SOLO POR: Usuario A y Usuario B 
```

---

## 7. Timeline de un Mensaje

```
T=0ms     Usuario A escribe "Hola"
          │
T=5ms     Generar IV aleatorio
          │
T=10ms    Cifrar con AES-256-GCM
          │  Mensaje cifrado
          │
T=15ms    Enviar a Stream Chat
          │
T=50ms    ─────► Servidor recibe mensaje cifrado
          │       (no puede leerlo)
          │
T=55ms    ─────► Reenvía a Usuario B
          │
T=100ms   Usuario B recibe "xK9p2vL...7bY"
          │
T=105ms   Descifrar con clave compartida
          │  Mensaje descifrado
          │
T=110ms   Mostrar "Hola" en pantalla
          │
          Proceso completo: ~110ms
```

---

## 8. Vectores de Ataque y Protecciones

```
┌────────────────────┬──────────────────────┬────────────────┐
│ Vector de Ataque   │ Sin E2EE             │ Con E2EE       │
├────────────────────┼──────────────────────┼────────────────┤
│ Interceptación     │  Mensaje legible     │  Cifrado      │
│ Modificación       │  Posible             │  Detectado    │
│ Man-in-the-middle  │  Vulnerable          │  Protegido    │
│ Servidor          │  Puede leer          │  No puede     │
│ Base de datos leak │  Todo expuesto       │  Cifrado     │
│ Replay attack      │  Posible             │  IV único    │
│ Brute force        │ N/A                  │  Inviable   │
└────────────────────┴──────────────────────┴────────────────┘
```

---

