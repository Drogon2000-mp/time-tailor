import crypto from 'crypto';

export const generateEsewaSignature = (secretKey, signatureString) => {
  try {
    return crypto.createHmac('sha256', secretKey).update(signatureString).digest('base64');
  } catch (error) {
    throw new Error('Signature generation failed');
  }
};