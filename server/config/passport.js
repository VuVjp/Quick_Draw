const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const admin = require('firebase-admin');

const db = admin.firestore();

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    },
    async (jwtPayload, done) => {
      try {
        const userDoc = await db.collection('users').doc(jwtPayload.userId).get();
        
        if (!userDoc.exists) {
          return done(null, false);
        }

        return done(null, { 
          userId: jwtPayload.userId,
          email: jwtPayload.email,
          ...userDoc.data()
        });
      } catch (error) {
        console.error('JWT Strategy error:', error);
        return done(error, false);
      }
    }
  )
);

module.exports = passport;
