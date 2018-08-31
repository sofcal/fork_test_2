'use strict';

class Encryption {
  constructor() {}

  envelopeEncrypt(...args) {
    return envelopeEncryptImpl(this, ...args);
  }

  envelopeDecrypt(...args) {
    return envelopeDecryptImpl(this, ...args);
  }

}

const generateRandom = (deprecated, count) => {
  count = count && count > 0 ? count : 12;
  return require('crypto').randomBytes(count).toString('hex');
};

const envelopeEncryptImpl = (self, data, generateDataKey) => {
  const packEnvelope = (encryptedKey, iv, encryptedBuffer) => {
    const ivLength = iv.length;
    const encryptedKeyLength = encryptedKey.length;
    let buffer = new Buffer(8);
    buffer.writeInt32LE(encryptedKeyLength, 0);
    buffer.writeInt32LE(ivLength, 4, 4);
    buffer = Buffer.concat([buffer, encryptedKey, iv], 8 + encryptedKeyLength + ivLength);
    return Buffer.concat([buffer, encryptedBuffer], buffer.length + encryptedBuffer.length);
  };

  return generateDataKey().then(keyResponse => {
    const plainTextKey = keyResponse.plain;
    const encryptedKey = keyResponse.encrypted;

    const crypto = require('crypto');

    const iv = new Buffer(generateRandom(null, 16), 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', plainTextKey, iv);
    const encrypted = [cipher.update(new Buffer(data))];
    encrypted.push(cipher.final());
    const encryptedBuffer = Buffer.concat(encrypted);
    return packEnvelope(encryptedKey, iv, encryptedBuffer);
  });
};

const envelopeDecryptImpl = (self, data, decryptDataKey) => {
  if (!Buffer.isBuffer(data)) {
    throw new Error('invalid input data; must be a string or a Buffer');
  }

  const unpackEnvelope = buffer => {
    const encryptedKeyLength = buffer.readInt32LE(0);
    const ivLength = buffer.readInt32LE(4);
    const encryptedKeyOffset = 8;
    const ivOffset = encryptedKeyOffset + encryptedKeyLength;
    const encryptedBufferOffset = ivOffset + ivLength;
    const encryptedKey = buffer.slice(encryptedKeyOffset, ivOffset);
    const iv = buffer.slice(ivOffset, encryptedBufferOffset);
    const encryptedBuffer = buffer.slice(encryptedBufferOffset);
    return {
      encryptedKey,
      iv,
      encryptedBuffer
    };
  };

  const unpacked = unpackEnvelope(data);
  return decryptDataKey(unpacked.encryptedKey).then(plainTextKey => {
    const crypto = require('crypto');

    const decipher = crypto.createDecipheriv('aes-256-cbc', plainTextKey, unpacked.iv);
    const decrypted = [decipher.update(new Buffer(unpacked.encryptedBuffer))];
    decrypted.push(decipher.final());
    return Buffer.concat(decrypted);
  });
};

module.exports = Encryption;