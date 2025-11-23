/**
 * Utilidad de cifrado End-to-End para ChatterBox (Frontend)
 * Usa Web Crypto API nativa del navegador
 */

/**
 * Genera un par de claves ECDH usando Web Crypto API
 * @returns {Promise<{publicKey: string, privateKey: CryptoKey}>}
 */
export async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256' // Curva elíptica estándar
        },
        true, // extractable
        ['deriveBits', 'deriveKey']
    );

    // Exportar clave pública a formato base64
    const publicKeyBuffer = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);

    return {
        publicKey: publicKeyBase64,
        privateKey: keyPair.privateKey // Se mantiene como CryptoKey
    };
}

/**
 * Importa una clave pública desde base64
 * @param {string} publicKeyBase64 
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKey(publicKeyBase64) {
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    
    return await window.crypto.subtle.importKey(
        'raw',
        publicKeyBuffer,
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true,
        []
    );
}

/**
 * Genera una clave compartida usando Diffie-Hellman
 * @param {CryptoKey} myPrivateKey 
 * @param {string} otherPublicKeyBase64 
 * @returns {Promise<CryptoKey>} Clave AES-GCM derivada
 */
export async function deriveSharedKey(myPrivateKey, otherPublicKeyBase64) {
    const otherPublicKey = await importPublicKey(otherPublicKeyBase64);
    
    // Derivar bits compartidos
    const sharedBits = await window.crypto.subtle.deriveBits(
        {
            name: 'ECDH',
            public: otherPublicKey
        },
        myPrivateKey,
        256 // 256 bits
    );

    // Importar como clave AES-GCM
    return await window.crypto.subtle.importKey(
        'raw',
        sharedBits,
        {
            name: 'AES-GCM',
            length: 256
        },
        false, // no extractable por seguridad
        ['encrypt', 'decrypt']
    );
}

/**
 * Cifra un mensaje usando AES-256-GCM
 * @param {string} message 
 * @param {CryptoKey} sharedKey 
 * @returns {Promise<string>} Mensaje cifrado (formato: iv.encryptedData en base64)
 */
export async function encryptMessage(message, sharedKey) {
    try {
        const encoder = new TextEncoder();
        const messageData = encoder.encode(message);
        
        // Generar IV aleatorio
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Cifrar
        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
                tagLength: 128 // Auth tag de 128 bits
            },
            sharedKey,
            messageData
        );
        
        // Formato: iv.encryptedData
        const ivBase64 = arrayBufferToBase64(iv);
        const encryptedBase64 = arrayBufferToBase64(encryptedData);
        
        return `${ivBase64}.${encryptedBase64}`;
    } catch (error) {
        console.error('Error encrypting message:', error);
        throw new Error('Failed to encrypt message');
    }
}

/**
 * Descifra un mensaje usando AES-256-GCM
 * @param {string} encryptedMessage (formato: iv.encryptedData)
 * @param {CryptoKey} sharedKey 
 * @returns {Promise<string>} Mensaje descifrado
 */
export async function decryptMessage(encryptedMessage, sharedKey) {
    try {
        const [ivBase64, encryptedBase64] = encryptedMessage.split('.');
        
        if (!ivBase64 || !encryptedBase64) {
            throw new Error('Invalid encrypted message format');
        }
        
        const iv = base64ToArrayBuffer(ivBase64);
        const encryptedData = base64ToArrayBuffer(encryptedBase64);
        
        // Descifrar
        const decryptedData = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(iv),
                tagLength: 128
            },
            sharedKey,
            encryptedData
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        console.error('Error decrypting message:', error);
        throw new Error('Failed to decrypt message - message may be corrupted or tampered');
    }
}

/**
 * Convierte ArrayBuffer a base64
 * @param {ArrayBuffer} buffer 
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Convierte base64 a ArrayBuffer
 * @param {string} base64 
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Almacena la clave privada en sessionStorage (persiste durante la sesión)
 * @param {CryptoKey} privateKey 
 */
export async function storePrivateKey(privateKey) {
    const exported = await window.crypto.subtle.exportKey('jwk', privateKey);
    sessionStorage.setItem('e2ee_private_key', JSON.stringify(exported));
}

/**
 * Recupera la clave privada desde sessionStorage
 * @returns {Promise<CryptoKey|null>}
 */
export async function getStoredPrivateKey() {
    const stored = sessionStorage.getItem('e2ee_private_key');
    if (!stored) return null;
    
    const jwk = JSON.parse(stored);
    return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'ECDH',
            namedCurve: 'P-256'
        },
        true,
        ['deriveBits', 'deriveKey']
    );
}

/**
 * Limpia las claves almacenadas (logout)
 */
export function clearStoredKeys() {
    sessionStorage.removeItem('e2ee_private_key');
}
