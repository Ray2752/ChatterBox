import crypto from 'crypto';
// Algoritmo de cifrado: AES-256-GCM 
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Genera un par de claves Diffie-Hellman (ECDH) para un usuario
 * @returns {Object} { publicKey, privateKey }
 */
export function generateKeyPair() {
    const ecdh = crypto.createECDH('secp256k1'); // Curva elíptica segura
    ecdh.generateKeys();
    
    return {
        publicKey: ecdh.getPublicKey('base64'),
        privateKey: ecdh.getPrivateKey('base64')
    };
}

/**
 * Genera una clave compartida usando Diffie-Hellman
 * @param {string} myPrivateKey - Clave privada del usuario actual (base64)
 * @param {string} otherPublicKey - Clave pública del otro usuario (base64)
 * @returns {Buffer} Clave compartida derivada
 */
export function generateSharedSecret(myPrivateKey, otherPublicKey) {
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(Buffer.from(myPrivateKey, 'base64'));
    
    const sharedSecret = ecdh.computeSecret(Buffer.from(otherPublicKey, 'base64'));
    
    // Derivar clave de 256 bits usando HKDF
    const derivedKey = crypto.hkdfSync(
        'sha256',
        sharedSecret,
        Buffer.alloc(0), // sin salt
        'chatterbox-e2ee',
        32 // 256 bits
    );
    
    return derivedKey;
}

/**
 * Cifra un mensaje usando AES-256-GCM
 * @param {string} message - Mensaje en texto plano
 * @param {Buffer} sharedSecret - Clave compartida derivada de Diffie-Hellman
 * @returns {string} Mensaje cifrado en formato: iv.authTag.encryptedData (base64)
 */
export function encryptMessage(message, sharedSecret) {
    try {
        // Generar IV aleatorio (importante: nunca reutilizar)
        const iv = crypto.randomBytes(IV_LENGTH);
        
        // Crear cipher con AES-256-GCM
        const cipher = crypto.createCipheriv(ALGORITHM, sharedSecret, iv);
        
        // Cifrar el mensaje
        let encrypted = cipher.update(message, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        // Obtener authentication tag (para detectar modificaciones)
        const authTag = cipher.getAuthTag();
        
        // Formato: iv.authTag.encryptedData (todo en base64)
        return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted}`;
    } catch (error) {
        console.error('Error encrypting message:', error);
        throw new Error('Failed to encrypt message');
    }
}

/**
 * Descifra un mensaje usando AES-256-GCM
 * @param {string} encryptedMessage - Mensaje cifrado (formato: iv.authTag.encryptedData)
 * @param {Buffer} sharedSecret - Clave compartida derivada de Diffie-Hellman
 * @returns {string} Mensaje descifrado en texto plano
 */
export function decryptMessage(encryptedMessage, sharedSecret) {
    try {
        // Separar componentes
        const [ivBase64, authTagBase64, encryptedData] = encryptedMessage.split('.');
        
        if (!ivBase64 || !authTagBase64 || !encryptedData) {
            throw new Error('Invalid encrypted message format');
        }
        
        const iv = Buffer.from(ivBase64, 'base64');
        const authTag = Buffer.from(authTagBase64, 'base64');
        
        // Crear decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, sharedSecret, iv);
        decipher.setAuthTag(authTag);
        
        // Descifrar
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Error decrypting message:', error);
        throw new Error('Failed to decrypt message - message may be corrupted or tampered');
    }
}

/**
 * Genera un hash HMAC para verificar integridad del mensaje
 * @param {string} message - Mensaje original
 * @param {Buffer} sharedSecret - Clave compartida
 * @returns {string} HMAC en base64
 */
export function generateMessageHMAC(message, sharedSecret) {
    const hmac = crypto.createHmac('sha256', sharedSecret);
    hmac.update(message);
    return hmac.digest('base64');
}

/**
 * Verifica el HMAC de un mensaje
 * @param {string} message - Mensaje original
 * @param {string} receivedHMAC - HMAC recibido
 * @param {Buffer} sharedSecret - Clave compartida
 * @returns {boolean} true si el HMAC es válido
 */
export function verifyMessageHMAC(message, receivedHMAC, sharedSecret) {
    const expectedHMAC = generateMessageHMAC(message, sharedSecret);
    return crypto.timingSafeEqual(
        Buffer.from(receivedHMAC, 'base64'),
        Buffer.from(expectedHMAC, 'base64')
    );
}

/**
 * Genera un ID único para identificar cada mensaje
 * @returns {string} UUID v4
 */
export function generateMessageId() {
    return crypto.randomUUID();
}
