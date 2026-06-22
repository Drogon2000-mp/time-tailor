// Appointment Model - Stores booked appointments
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phone: {
    type: String,
    trim: true,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^(98|97)\d{8}$/.test(v);
      },
      message: 'Invalid Nepali phone number (98/97 + 8 digits)'
    }
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  date: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  time: {
    type: String,
    required: [true, 'Appointment time is required']
  },
  type: {
    type: String,
    required: true,
    enum: ['consultation', 'measurement', 'fitting', 'delivery']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled', 'rejected', 'no-show'],
    default: 'pending'
  },
  cancelReason: {
    type: String,
    maxlength: [500, 'Reason too long']
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      maxlength: [500, 'Address too long']
    }
  }
}, {
  timestamps: true
});

appointmentSchema.index({ user: 1, date: -1 });
appointmentSchema.index({ date: 1, time: 1 });
appointmentSchema.index({ status: 1 });

appointmentSchema.virtual('formattedDate').get(function() {
  return new Date(this.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
