// Google Auth Route
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();
const googleClientId = process.env.GOOGLE_CLIENT_ID;

// Only instantiate OAuth client if configured.
// This avoids runtime breakage when GOOGLE_CLIENT_ID is not set.
const client = googleClientId ? new OAuth2Client(googleClientId) : null;



router.post('/google', async (req, res) => {
  const startedAt = Date.now();

  try {
    const { id_token } = req.body;

    // ---- Validation ----
    if (!id_token) {
      console.warn('[GoogleAuth] Missing id_token in request body');
      return res.status(400).json({
        success: false,
        message: 'Missing id_token'
      });
    }

    if (typeof id_token !== 'string' || id_token.split('.').length !== 3) {
      console.warn('[GoogleAuth] id_token is not a JWT-like string', {
        type: typeof id_token,
        parts: typeof id_token === 'string' ? id_token.split('.').length : null
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid id_token format'
      });
    }

    if (!client) {
      console.error('[GoogleAuth] GOOGLE_CLIENT_ID not configured');
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration (GOOGLE_CLIENT_ID)'
      });
    }

    // ---- Debug logging (safe) ----
    console.log('[GoogleAuth] Verifying token', {
      tokenLength: id_token.length,
      audienceExpected: googleClientId,
      envClientIdPresent: !!googleClientId
    });

    // ---- Verify ID token ----
    // verifyIdToken throws if invalid/expired/audience mismatch.
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: googleClientId
      // issuer can also be constrained, see below
    });


    const payload = ticket.getPayload();

    if (!payload) {
      console.warn('[GoogleAuth] No payload returned from verifyIdToken');
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token payload'
      });
    }

    const {
      email,
      name,
      picture,
      sub: googleId,
      aud,
      iss
    } = payload;

    // ---- Extra payload validation ----
    if (!email || !googleId) {
      console.warn('[GoogleAuth] Missing expected fields in payload', {
        hasEmail: !!email,
        hasGoogleId: !!googleId
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token payload'
      });
    }

    // aud should match googleClientId; issuer should be a Google accounts issuer.
    // (These checks help distinguish true clientId mismatch vs other issues.)
    if (aud !== googleClientId) {
      console.error('[GoogleAuth] Audience mismatch', {
        audFromToken: aud,
        expectedAud: googleClientId
      });
      return res.status(401).json({
        success: false,
        message: 'Google clientId (aud) mismatch'
      });
    }

    if (typeof iss !== 'string' || !iss.includes('accounts.google.com')) {
      console.error('[GoogleAuth] Unexpected issuer', { iss });
      return res.status(401).json({
        success: false,
        message: 'Unexpected Google token issuer'
      });
    }

    const normalizedEmail = String(email).toLowerCase();

    // Find or create user
    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { googleId }]
    });

    if (!user) {
      user = new User({
        name,
        email: normalizedEmail,
        googleId,
        picture,
        password: undefined // No password for Google users
      });
      await user.save();
    }

    const token = generateToken({
      _id: user._id,
      role: user.role,
      email: user.email,
      name: user.name,
    });

    // Store in httpOnly cookie so `authenticate` can read it from req.cookies.token
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('[GoogleAuth] Success', {
      userId: user._id?.toString?.(),
      email: normalizedEmail,
      durationMs: Date.now() - startedAt
    });

    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    // ---- Detailed error logging ----
    console.error('[GoogleAuth] Verification failed', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      durationMs: Date.now() - startedAt
    });

    // google-auth-library often returns errors like:
    // - invalid_grant / invalid_request / audience mismatch / expired / etc.
    return res.status(401).json({
      success: false,
      message: error?.message || 'Invalid Google token',
      // Keeping it explicit makes debugging much faster in dev.
      debug: {
        hint: 'Check GOOGLE_CLIENT_ID matches frontend VITE_GOOGLE_CLIENT_ID and token is id_token from @react-oauth/google'
      }
    });
  }
});

export default router;
