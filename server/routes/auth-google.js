// Google Auth Route
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;
    
    // Find or create user
    let user = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { googleId }]
    });
    
    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        googleId,
        picture,
        password: undefined // No password for Google users
      });
      await user.save();
    }
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid Google token'
    });
  }
});

export default router;

