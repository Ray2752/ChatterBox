# 🚀 Guía Rápida - Cifrado E2EE en ChatterBox

## ⚡ Instalación y Uso

### 1. **Configuración Inicial**

No se requiere instalación adicional. El cifrado usa:
- ✅ `crypto` (nativo en Node.js)
- ✅ Web Crypto API (nativa en navegadores modernos)

### 2. **Archivos Creados**

#### Backend:
- `backend/src/lib/encryption.js` - Utilidades de cifrado
- `backend/src/controllers/user.controller.js` - Endpoints de claves públicas
- `backend/src/routes/user.route.js` - Rutas API
- `backend/src/models/User.js` - Campo `publicKey` agregado

#### Frontend:
- `frontend/src/lib/encryption.js` - Cifrado del lado del cliente
- `frontend/src/hooks/useEncryption.js` - Hook React personalizado
- `frontend/src/lib/api.js` - Llamadas API para claves
- `frontend/src/pages/ChatPage.jsx` - Integración con Stream Chat

### 3. **Cómo Funciona** (Para el Usuario)

1. **Login/Signup** (normal, como antes)
2. **Abrir chat con un amigo**
   - El sistema genera automáticamente claves
   - Se intercambian claves públicas
   - Se establece cifrado E2EE
3. **Enviar mensaje**
   - Usuario escribe normalmente
   - El mensaje se cifra automáticamente antes de enviarse
   - El otro usuario lo recibe y descifra automáticamente

**¡Todo es transparente para el usuario!** 🎉

### 4. **Indicadores Visuales**

- `🔒` - Mensaje cifrado
- `🔓` - Mensaje descifrado correctamente
- `⚠️` - Error de descifrado (mensaje corrupto/modificado)

### 5. **Probar el Sistema**

#### Paso 1: Iniciar Backend
```bash
cd backend
npm start
```

#### Paso 2: Iniciar Frontend
```bash
cd frontend
npm run dev
```

#### Paso 3: Abrir dos ventanas
- Ventana 1: Usuario A (http://localhost:5173)
- Ventana 2: Usuario B (http://localhost:5173) - navegación privada

#### Paso 4: Enviar mensajes
- Los mensajes se cifran automáticamente
- Abre DevTools y ve la consola:
  - `🔐 Generating new key pair...`
  - `🔑 Deriving shared encryption key...`
  - `✅ E2EE encryption ready!`
  - `🔒 Message encrypted and sent`

### 6. **Verificar Cifrado**

#### En MongoDB:
Los mensajes en Stream Chat están cifrados:
```json
{
  "text": "xK9p2vL...eH7s.mN4q...8zT.pR3w...7bY",
  "encrypted": true
}
```

#### En Consola del Navegador:
```javascript
console.log("Mensaje original:", "Hola");
console.log("Mensaje cifrado:", await encrypt("Hola"));
// Output: "xK9p2vL...eH7s.mN4q...8zT.pR3w...7bY"
```

### 7. **Seguridad**

#### ⚠️ IMPORTANTE - Antes de Producción:

1. **Cambia tus credenciales del .env**
   ```env
   MONGO_URI=<tu-nueva-conexión>
   JWT_SECRET_KEY=<genera-una-nueva-clave>
   STREAM_API_KEY=<nueva-key>
   STREAM_API_SECRET=<nuevo-secret>
   ```

2. **Genera nueva JWT_SECRET_KEY:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Habilita HTTPS en producción**

#### Claves Privadas:
- ✅ Se guardan en `sessionStorage` (se borran al cerrar pestaña)
- ✅ NUNCA se envían al servidor
- ✅ Se regeneran en cada sesión

### 8. **Troubleshooting**

#### Error: "Encryption not ready yet"
**Solución:** Espera 1-2 segundos. El sistema está generando las claves.

#### Error: "Failed to decrypt message"
**Causa:** El mensaje fue modificado o las claves no coinciden.
**Solución:** Verifica que ambos usuarios tengan claves públicas generadas.

#### Mensajes sin cifrar (sin 🔒)
**Causa:** Mensajes antiguos o envío sin esperar a `encryptionReady`.
**Solución:** Refresca la página y envía nuevos mensajes.

### 9. **Demostración para Proyecto Escolar**

#### Script de Demostración:

1. **Mostrar autenticación:**
   - Login → JWT generado
   - Contraseña hasheada con bcrypt

2. **Mostrar generación de claves:**
   - Abrir DevTools
   - Entrar al chat
   - Ver logs: "🔐 Generating new key pair..."

3. **Mostrar cifrado:**
   - Enviar mensaje: "Hola profesor"
   - Ver en consola el mensaje cifrado
   - Explicar que solo el destinatario puede leerlo

4. **Mostrar detección de modificaciones:**
   - Intentar modificar mensaje cifrado en Stream Chat
   - Mostrar error de descifrado

5. **Explicar Diffie-Hellman:**
   - Dibujar diagrama en pizarra
   - Explicar que nunca se transmite la clave privada

### 10. **Recursos de Aprendizaje**

- **Documentación completa:** `ENCRYPTION_DOCUMENTATION.md`
- **Código comentado:** Todos los archivos tienen explicaciones
- **Diagramas:** En la documentación
- **Referencias académicas:** Al final de la documentación

### 11. **Endpoints API**

```bash
# Obtener clave pública de un usuario
GET /api/users/:id/public-key

# Actualizar mi clave pública
PUT /api/users/my-public-key
Body: { "publicKey": "base64string" }
```

### 12. **Desactivar Cifrado (si es necesario)**

Si necesitas desactivar temporalmente el cifrado:

**En `ChatPage.jsx`:**
```javascript
// Comentar esta línea:
// const { encrypt, decrypt, isReady, loading } = useEncryption(myId, friendId);

// Y usar MessageInput normal:
<MessageInput focus />
```

---

## 📝 Checklist para Entrega del Proyecto

- [ ] Código documentado y comentado
- [ ] `ENCRYPTION_DOCUMENTATION.md` impreso
- [ ] Demo funcional preparada
- [ ] Diagrama de flujo explicando el proceso
- [ ] Explicación de cada componente de seguridad:
  - [ ] AES-256-GCM (cifrado)
  - [ ] ECDH (intercambio de claves)
  - [ ] bcrypt (contraseñas)
  - [ ] JWT (autenticación)
  - [ ] Authentication tags (integridad)

---

## 🎓 Conceptos Clave para Explicar

1. **¿Por qué E2EE?** - Privacidad total, ni el servidor lee mensajes
2. **¿Por qué AES-256?** - Estándar militar, seguridad probada
3. **¿Por qué GCM?** - Cifrado + autenticación en uno
4. **¿Por qué ECDH?** - Intercambio seguro sin transmitir claves
5. **¿Por qué bcrypt?** - Diseñado para contraseñas, resistente a ataques

---

**¡Sistema listo para usar y presentar!** 🎉

Para más detalles técnicos, consulta `ENCRYPTION_DOCUMENTATION.md`
