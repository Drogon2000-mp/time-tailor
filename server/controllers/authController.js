// Auth Controller
import User from '../models/User.js';
import bcrypt from 'bcryptjs'; // Import bcrypt for password comparison if not handled by model
import { generateToken } from '../middleware/auth.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = new User({ name, email: email.toLowerCase(), password, phone });
    await user.save();
    const token = generateToken({ 
      _id: user._id, 
      role: user.role, 
      email: user.email, 
      name: user.name 
    });
    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Add clear logging
    console.log("Login attempt for:", email);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    // If User model has a comparePassword method using bcrypt, use it.
    // Otherwise, use bcrypt.compare directly here.
    const isMatch = user && (await user.comparePassword(password)); // Assuming user.comparePassword exists and uses bcrypt
    // If user.comparePassword doesn't exist, use: const isMatch = user && (await bcrypt.compare(password, user.password));

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate JWT with _id, role, and email
    const token = generateToken({ 
      _id: user._id, 
      role: user.role, 
      email: user.email, 
      name: user.name 
    });
    res.json({ success: true, data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role }, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
