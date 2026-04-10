// Button Design Model - Admin managed button options
import mongoose from 'mongoose';

const buttonDesignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Button name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['material', 'style', 'color'],
    required: true
  },
  options: [{
    value: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      default: ''
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ButtonDesign = mongoose.model('ButtonDesign', buttonDesignSchema);

export default ButtonDesign;

