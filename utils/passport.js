const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../modals/userModal'); // Ensure the correct path to the user model
const passport = require('passport');

// Microsoft OAuth Strategy
passport.use(
  new MicrosoftStrategy(
    {
      // Basic configuration
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:5000/api/users/microsoft/callback',

      // Azure AD specific configuration
      authorizationURL: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,

      // Updated scopes to include 'user.read'
      scope: ['openid', 'profile', 'email', 'user.read'],
      profileURL: 'https://graph.microsoft.com/v1.0/me',
      state: true, // CSRF protection
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Fetch user info from Microsoft Graph API
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await response.json();

        // Log the profile data for debugging
        console.log('Microsoft Profile Data:', JSON.stringify(data, null, 2));

        // Extract required information
        const email = data.mail || data.userPrincipalName; // Fallback to userPrincipalName if mail is missing
        const name = data.displayName || 'Unknown User';

        if (!email) {
          console.error('Email not found in Microsoft Graph API response:', data);
          return done(new Error('Email not provided by Microsoft'), null);
        }

        // Restrict to specific domain
        if (!email.endsWith('@bennett.edu.in')) {
          console.warn(`Unauthorized email domain attempt: ${email}`);
          return done(new Error('Unauthorized domain. Only @bennett.edu.in emails are allowed'), null);
        }

        // Find or create user in the database
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name,
            email,
            oauth: true,
            microsoftId: data.id, // Save Microsoft Graph ID
            profileData: {
              provider: 'microsoft',
              lastLogin: new Date(),
              displayName: name,
            },
          });
        } else {
          // Update the last login timestamp for the existing user
          user.profileData.lastLogin = new Date();
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error('Error in Microsoft OAuth Strategy:', error);
        return done(error, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    if (!user) {
      return done(new Error('User not found'), null);
    }
    done(null, user);
  } catch (error) {
    console.error('Error in deserializing user:', error);
    done(error, null);
  }
});

// Export configured passport 
module.exports = passport;
