const jwt = require('jsonwebtoken');
const secret = 'P!zz@GuV!';

const createJWT = (obj) => {
  return jwt.sign(obj, secret, { expiresIn: '1h' });
};

const authenticate = async (req, res, next) => {
  try {
    const bearer = await req.headers['authorization'];
    if (!bearer) return res.json({ message: 'access failed' });
    jwt.verify(bearer, secret, (err, decode) => {
      if (res) {
        req.body.auth = decode;
        next();
      } else res.json({ message: 'authentication failed' });
    });
  } catch (error) {
    return res.json({
      message: 'something went wrong authentication',
    });
  }
};

const permit = (...roles) => {
  return (req, res, next) => {
    const { role } = req.body.auth;
    if (roles.includes(role)) {
      next();
    } else {
      res.json({ message: 'no access to this route' });
    }
  };
};

module.exports = { createJWT, authenticate, permit };
