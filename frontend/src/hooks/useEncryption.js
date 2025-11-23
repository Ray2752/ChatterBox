import { useState, useEffect } from 'react';
import { getUserPublicKey, updateMyPublicKey } from '../lib/api';
import { 
    generateKeyPair, 
    deriveSharedKey, 
    encryptMessage, 
    decryptMessage,
    storePrivateKey,
    getStoredPrivateKey
} from '../lib/encryption';
import toast from 'react-hot-toast';

/**
 * Hook para manejar cifrado E2EE en el chat
 * @param {string} currentUserId - ID del usuario autenticado
 * @param {string} targetUserId - ID del usuario con quien se chatea
 * @returns {Object} Funciones de cifrado/descifrado y estado
 */
export function useEncryption(currentUserId, targetUserId) {
    const [sharedKey, setSharedKey] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUserId || !targetUserId) {
            setLoading(false);
            return;
        }

        const initializeEncryption = async () => {
            try {
                setLoading(true);

                // 1. Verificar si ya tenemos clave privada en sessionStorage
                let myPrivateKey = await getStoredPrivateKey();
                let myPublicKey;

                if (!myPrivateKey) {
                    // Generar nuevo par de claves
                    console.log('🔐 Generating new key pair...');
                    const keyPair = await generateKeyPair();
                    myPrivateKey = keyPair.privateKey;
                    myPublicKey = keyPair.publicKey;

                    // Guardar en sessionStorage
                    await storePrivateKey(myPrivateKey);

                    // Enviar clave pública al servidor
                    try {
                        await updateMyPublicKey(myPublicKey);
                        console.log('✅ Public key sent to server');
                    } catch (err) {
                        console.warn('⚠️ Could not send public key to server:', err);
                        // Continuar sin cifrado
                        setIsReady(false);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Obtener clave pública del otro usuario
                let otherPublicKey;
                try {
                    const response = await getUserPublicKey(targetUserId);
                    otherPublicKey = response.publicKey;
                } catch (err) {
                    console.warn('⚠️ Could not get target user public key:', err);
                    // Continuar sin cifrado
                    setIsReady(false);
                    setLoading(false);
                    return;
                }
                
                if (!otherPublicKey) {
                    console.warn('⚠️ Target user does not have a public key yet');
                    setIsReady(false);
                    setLoading(false);
                    return;
                }

                // 3. Derivar clave compartida usando Diffie-Hellman
                console.log('🔑 Deriving shared encryption key...');
                const derivedKey = await deriveSharedKey(myPrivateKey, otherPublicKey);
                setSharedKey(derivedKey);
                setIsReady(true);
                console.log('✅ E2EE encryption ready!');

            } catch (error) {
                console.error('❌ Error initializing encryption:', error);
                // No mostrar error al usuario, simplemente desactivar cifrado
                setIsReady(false);
            } finally {
                setLoading(false);
            }
        };

        initializeEncryption();
    }, [currentUserId, targetUserId]);

    /**
     * Cifra un mensaje antes de enviarlo
     * @param {string} plainText 
     * @returns {Promise<string>} Texto cifrado
     */
    const encrypt = async (plainText) => {
        if (!sharedKey) {
            throw new Error('Encryption not initialized');
        }
        return await encryptMessage(plainText, sharedKey);
    };

    /**
     * Descifra un mensaje recibido
     * @param {string} cipherText 
     * @returns {Promise<string>} Texto descifrado
     */
    const decrypt = async (cipherText) => {
        if (!sharedKey) {
            throw new Error('Encryption not initialized');
        }
        return await decryptMessage(cipherText, sharedKey);
    };

    return {
        encrypt,
        decrypt,
        isReady,
        loading
    };
}
