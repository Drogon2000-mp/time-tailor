// Fail-fast environment validation for production deployments.
// Import this module from server/server.js before using process.env.

const required = [
  'PORT',
  'JWT_SECRET',
  'MONGODB_URI',

  'CLIENT_URL',
  'FRONTEND_URL',

  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_NAME',

  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',

  'ESEWA_PRODUCT_CODE',
  'ESEWA_SECRET_KEY',
  'ESEWA_SUCCESS_URL',
  'ESEWA_FAILURE_URL',

];

function missingEnv() {
  const missing = [];
  for (const key of required) {
    const val = process.env[key];
    if (val === undefined || val === null || String(val).trim() === '') missing.push(key);
  }
  return missing;
}

export function validateEnv() {
  const missing = missingEnv();
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[validateEnv] Missing required env variables:', missing.join(', '));
    process.exit(1);
  }
}

export default validateEnv;

