# ChatterBox - Sistema de Cifrado End-to-End (E2EE)
---

## Resumen del Proyecto

ChatterBox implementa un sistema de **cifrado end-to-end (E2EE)** para mensajes de chat, cumpliendo con los siguientes requerimientos académicos:

**Cifrado de mensajes** usando AES-256-GCM  
**Autenticación de usuarios** con JWT + bcrypt  
**Detección de modificaciones** mediante authentication tags (GCM)  
**Intercambio seguro de claves** con Elliptic Curve Diffie-Hellman (ECDH)  
**Funciones hash** implementadas correctamente (bcrypt para contraseñas)  
**Interfaz amigable** que mantiene la UX del chat

---

## Tecnologías de Cifrado Implementadas

### 1. **AES-256-GCM (Advanced Encryption Standard - Galois/Counter Mode)**

**¿Qué es?**
- Algoritmo de cifrado simétrico estándar de la industria
- Clave de 256 bits (máxima seguridad)
- Modo GCM que incluye autenticación integrada

**¿Por qué GCM?**
- Confidencialidad (el mensaje se cifra)
- Integridad (detecta modificaciones)
- Autenticación (verifica el origen)

**Implementación:**
```javascript
// Backend: Node.js crypto
const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv);

// Frontend: Web Crypto API
await window.crypto.subtle.encrypt({
    name: 'AES-GCM',
    iv: iv,
    tagLength: 128
}, sharedKey, messageData);
```

---

## 2. **ECDH (Elliptic Curve Diffie-Hellman)**

**¿Qué es?**
- Protocolo de intercambio de claves criptográficas
- Permite que dos usuarios generen una clave compartida sin transmitirla
- Usa curvas elípticas para mayor seguridad con claves más pequeñas

**Curva utilizada:**
- **Backend:** `secp256k1` (la misma que Bitcoin)
- **Frontend:** `P-256` (NIST recomendado)

**Flujo de intercambio:**
```
Usuario A                          Usuario B
---------                          ---------
Genera par de claves:             Genera par de claves:
- Privada A (secreta)             - Privada B (secreta)
- Pública A                       - Pública B
        │                               │
        └────── Intercambian ──────────┘
                públicas
        │                               │
        ▼                               ▼
Calcula: DH(Privada A, Pública B)  Calcula: DH(Privada B, Pública A)
        │                               │
        └───────► Misma clave! ◄────────┘
```

---

### 3. **bcrypt (Password Hashing)**

**¿Qué es?**
- Función de hash diseñada específicamente para contraseñas
- Incluye "salt" automático para proteger contra rainbow tables
- Computacionalmente costoso (protege contra fuerza bruta)

**Configuración:**
```javascript
const salt = await bcrypt.genSalt(10); // 10 rounds = 2^10 iteraciones
const hashedPassword = await bcrypt.hash(password, salt);
```

**Seguridad:**
- One-way function (irreversible)
- Protección contra timing attacks
- Resistente a fuerza bruta

---

## Arquitectura del Sistema

### Flujo Completo de un Mensaje

```
┌─────────────────────────────────────────────────────────────┐
│  1. INICIO DE SESIÓN (Autenticación)                        │
├─────────────────────────────────────────────────────────────┤
│  Usuario ingresa email + contraseña                         │
│  → Backend: bcrypt.compare(password, hashedPassword)        │
│  → Genera JWT firmado con clave secreta                     │
│  → Cookie HTTP-only enviada al cliente                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. GENERACIÓN DE CLAVES (Primera vez en chat)              │
├─────────────────────────────────────────────────────────────┤
│  Usuario A:                      Usuario B:                 │
│  • Genera par ECDH (A_priv, A_pub)                          │
│  • Guarda A_priv en sessionStorage                          │
│  • Envía A_pub al servidor                                  │
│                                                              │
│  → Backend almacena claves públicas en MongoDB              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. INTERCAMBIO DE CLAVES (Al abrir chat con otro usuario)  │
├─────────────────────────────────────────────────────────────┤
│  • Cliente solicita clave pública del otro usuario          │
│  • Calcula clave compartida: DH(mi_privada, su_pública)     │
│  • Deriva clave AES-256 usando HKDF                          │
│  • Ambos tienen la misma clave sin transmitirla              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. ENVÍO DE MENSAJE                                         │
├─────────────────────────────────────────────────────────────┤
│  Usuario A escribe: "Hola, ¿cómo estás?"                    │
│                              ↓                               │
│  CIFRADO (AES-256-GCM):                                   │
│  • Genera IV aleatorio (12 bytes)                           │
│  • Cifra mensaje con clave compartida                        │
│  • Genera authentication tag (16 bytes)                      │
│  • Formato: "iv.authTag.dataCifrado" (todo en base64)       │
│                              ↓                               │
│  Mensaje cifrado se ve así:                                  │
│  "xK9p2vL...eH7s.mN4q...8zT.pR3w...7bY"                    │
│                              ↓                               │
│  → Envía a Stream Chat con flag {encrypted: true}           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. RECEPCIÓN Y DESCIFRADO                                   │
├─────────────────────────────────────────────────────────────┤
│  Usuario B recibe mensaje cifrado:                          │
│  "xK9p2vL...eH7s.mN4q...8zT.pR3w...7bY"                    │
│                              ↓                               │
│   DESCIFRADO:                                              │
│  • Separa: IV + AuthTag + Datos cifrados                    │
│  • Verifica AuthTag (detecta modificaciones)                │
│  • Descifra con clave compartida                            │
│                              ↓                               │
│   Resultado: "Hola, ¿cómo estás?"                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Estructura del Código

### Backend (Node.js)

```
backend/src/
├── lib/
│   ├── encryption.js          # Utilidades de cifrado
│   ├── db.js                   # Conexión a MongoDB
│   └── stream.js               # Integración con Stream Chat
├── models/
│   └── User.js                 # Modelo con campo publicKey
├── controllers/
│   ├── auth.controller.js      # Login, signup (bcrypt + JWT)
│   └── user.controller.js      # Endpoints de claves públicas
└── routes/
    └── user.route.js           # GET /:id/public-key, PUT /my-public-key
```

**Funciones clave en `encryption.js`:**
- `generateKeyPair()` - Crea par ECDH
- `generateSharedSecret(privateKey, publicKey)` - Calcula clave compartida
- `encryptMessage(message, sharedSecret)` - Cifra con AES-256-GCM
- `decryptMessage(encrypted, sharedSecret)` - Descifra mensaje

### Frontend (React)

```
frontend/src/
├── lib/
│   ├── encryption.js           # Cifrado usando Web Crypto API
│   └── api.js                  # Llamadas HTTP (axios)
├── hooks/
│   └── useEncryption.js        # Hook personalizado para E2EE
└── pages/
    └── ChatPage.jsx            # Integración con Stream Chat
```

**Hook `useEncryption(currentUserId, targetUserId)`:**
```javascript
const { encrypt, decrypt, isReady, loading } = useEncryption(myId, friendId);

// Uso:
const encryptedMsg = await encrypt("Hola");
const decryptedMsg = await decrypt(encryptedMsg);
```

---

## Seguridad Implementada

### 1. **Confidencialidad** 
- Mensajes cifrados con AES-256 (estándar militar)
- Claves nunca se transmiten (solo públicas)
- IV aleatorio único por mensaje

### 2. **Integridad** 
- Authentication tag en GCM detecta modificaciones
- Cualquier cambio en el mensaje causa error de descifrado
### 3. **Autenticación** 
- JWT para identificar usuarios
- bcrypt para verificar contraseñas
- Cookies HTTP-only (protección XSS)
### 4. **No Repudio** 
- Solo el poseedor de la clave privada puede enviar mensajes válidos
- Stream Chat registra timestamps y metadatos
    
### 5. **Perfect Forward Secrecy** 
- Las claves se regeneran por sesión
- Si una clave se compromete, mensajes pasados siguen seguros
---

### Librerías Utilizadas
- **Backend:** `crypto` (Node.js nativo), `bcryptjs`, `jsonwebtoken`
- **Frontend:** Web Crypto API (nativa del navegador)

### Herramientas
- **Stream Chat:** Infraestructura de mensajería
- **MongoDB:** Almacenamiento de claves públicas
- **React:** Interfaz de usuario

