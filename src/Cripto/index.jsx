// crypto/crypto.js
import CryptoJS from 'crypto-js';
import base64 from 'base-64'; // Instale: npm install base-64

// Chaves secretas (mesmas do backend)
const secretKeyAES = "a53650a05d0c2d20b93433e828e2ab79f89d3f2669b82dbcba9a560b186dad8fa7701eda833a7b7994eda0538260d4c870f0c273248bbcd69fb34ac10a1bc11e";
const secretKeyHMAC = "51859f08e51dea252dbfbf5a32b3559c9a6cdb41a1fe93f9f2eea7a3de7b0df6";


export function Criptografar(MENSAGEM) {
    // Criptografar a mensagem com AES
    const encryptedMessage = CryptoJS.AES.encrypt(JSON.stringify(MENSAGEM), secretKeyAES).toString();

    // Gerar a assinatura HMAC da mensagem criptografada
    const hmacSignature = CryptoJS.HmacSHA256(encryptedMessage, secretKeyHMAC).toString();

    // Combinar a mensagem criptografada e a assinatura em um objeto e codificar em Base64
    return base64.encode(JSON.stringify({ encryptedMessage, hmacSignature }));
}


export function Descriptografar(MENSAGEM) {
    // Decodificar a mensagem Base64 e parsear o JSON
    const decodedMessage = JSON.parse(base64.decode(MENSAGEM));
    const { encryptedMessage, hmacSignature } = decodedMessage;

    // Verificar a assinatura HMAC
    const calculatedHMAC = CryptoJS.HmacSHA256(encryptedMessage, secretKeyHMAC).toString();
    if (calculatedHMAC !== hmacSignature) {
        throw new Error("Assinatura HMAC inválida. Os dados podem ter sido alterados.");
    }

    // Descriptografar a mensagem com AES
    const decryptedMessage = CryptoJS.AES.decrypt(encryptedMessage, secretKeyAES).toString(CryptoJS.enc.Utf8);

    return JSON.parse(decryptedMessage);
}



// Função auxiliar para verificar se a string já está descriptografada
export function isEncrypted(data) {
    if (typeof data !== 'string') return false;
    try {
        // Tenta decodificar base64
        const decoded = base64.decode(data);
        // Tenta parsear JSON
        JSON.parse(decoded);
        return true;
    } catch {
        return false;
    }
}

// Função para descriptografar ou retornar o objeto se já estiver descriptografado
export function safeDescriptografar(data) {
    if (typeof data === 'string' && isEncrypted(data)) {
        return Descriptografar(data);
    }
    return data;
}