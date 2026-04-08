const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema - Stores authentication credentials
 * Passwords are hashed using bcrypt
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        message: 'Invalid email format'
      }
    },
    
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default
    },
    
    // Profile info
    firstName: {
      type: String,
      default: ''
    },
    
    lastName: {
      type: String,
      default: ''
    },
    
    // Account status
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Security
    lastLogin: {
      type: Date,
      default: null
    },
    
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    
    lockedUntil: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password with hash
userSchema.methods.comparePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to get public user data (without sensitive info)
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: 1 });

module.exports = mongoose.model('User', userSchema);
