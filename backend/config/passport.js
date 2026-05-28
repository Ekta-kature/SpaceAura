// config/passport.js — Google OAuth (gracefully skipped if credentials missing)
const passport = require('passport');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
  const prisma = require('./db');

  passport.use(new GoogleStrategy({
    clientID:    process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  }, async (_at, _rt, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'), null);
      let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
      if (!user) {
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          user = await prisma.user.update({ where: { email }, data: { googleId: profile.id, isVerified: true, avatar: profile.photos?.[0]?.value } });
        } else {
          user = await prisma.user.create({
            data: { email, googleId: profile.id, name: profile.displayName, avatar: profile.photos?.[0]?.value, isVerified: true, role: 'CUSTOMER' },
          });
        }
      }
      return done(null, user);
    } catch (err) { return done(err, null); }
  }));
} else {
  console.warn('⚠️  Google OAuth not configured — skipping. Add GOOGLE_CLIENT_ID to .env to enable.');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const prisma = require('./db');
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) { done(err, null); }
});
