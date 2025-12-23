const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                // Check if user exists with same email
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // Link google account to existing user
                    user.googleId = profile.id;
                    user.authProvider = 'google';
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                user = new User({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    profilePicture: profile.photos[0].value,
                    authProvider: 'google',
                    role: 'student', // Default role
                    isEmailVerified: true // Google emails are verified
                });

                await user.save();
                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    ));
} else {
    console.warn("⚠️ Google OAuth credentials not found in .env. Google Auth will be unavailable.");
}

module.exports = passport;
