const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar JWT token
 */
const authenticateToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
      });
    }

    // Verificar token
    jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-secret-key-temporal',
      (err, user) => {
        if (err) {
          if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
              success: false,
              message: 'Token expirado',
            });
          }

          return res.status(403).json({
            success: false,
            message: 'Token inválido',
          });
        }

        // Agregar información del usuario al request
        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar autenticación',
      error: error.message,
    });
  }
};

/**
 * Middleware opcional - no falla si no hay token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu-secret-key-temporal',
      (err, user) => {
        if (err) {
          req.user = null;
        } else {
          req.user = user;
        }
        next();
      }
    );
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Middleware para verificar que el usuario esté activo
 */
const requireActiveAccount = (req, res, next) => {
  if (req.user.accountState !== 'active') {
    return res.status(403).json({
      success: false,
      message: `Cuenta ${req.user.accountState}. Contacta al soporte.`,
    });
  }
  next();
};

/**
 * Middleware para verificar roles/tipos de usuario
 */
const requireUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireActiveAccount,
  requireUserType,
};
