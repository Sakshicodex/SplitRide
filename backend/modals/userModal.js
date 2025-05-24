const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)@\w+([.-]?\w+)(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      required: function () {
        return !this.oauth; // Password required only for non-OAuth users
      },
      select: false,
    },
    phoneNumber: {
      type: String,
      required: [false, "Phone number is required"],
      match: [
        /^\d{10}$/,
        "Please enter a valid 10-digit phone number",
      ],
    },
    profilePicture: {
      type: String,
      default: 'https://example.com/default-profile.png', // Replace with your default image URL
    },
    oauth: {
      type: Boolean,
      default: false, // Indicates if the user is created via OAuth
    },
    microsoftId: {
      type: String, // Store Microsoft Graph ID for OAuth users
    },
    profileData: {
      displayName: { type: String }, // Display name from OAuth provider
      lastLogin: { type: Date }, // Last login timestamp
      provider: { type: String, default: 'local' }, // 'local', 'microsoft', etc.
    },
    otp: {
      type: String, // Store OTP for email verification or password reset
    },
    otpExpires: {
      type: Date, // Expiry time for OTP
    },
    verified: {
      type: Boolean, // Indicates if the user's email is verified
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash the password before saving (only if modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;