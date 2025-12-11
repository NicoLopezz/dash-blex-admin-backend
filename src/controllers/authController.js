/**
 * Auth Controller - Simple Session-based Authentication
 *
 * Login super simple:
 * - Contrasta email y password con variables de entorno (.env)
 * - Sin JWT tokens
 * - Usa cookies de sesión cifradas (express-session)
 */

/**
 * POST /api/auth/login
 * Login simple con credenciales de .env
 * Email: ADMIN_EMAIL (default: admin@blexgroup.com)
 * Password: ADMIN_PASSWORD (default: admin)
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos requeridos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password son requeridos',
      });
    }

    // Credenciales desde .env
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@blexgroup.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nano2025';

    // Verificar credenciales (simple comparación)
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Guardar sesión en cookie cifrada
    req.session.isAuthenticated = true;
    req.session.user = {
      id: 1,
      name: 'Administrador Blex',
      email: ADMIN_EMAIL,
      role: 'admin',
    };

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      user: req.session.user,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar login',
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado desde la sesión
 */
const getMe = async (req, res) => {
  try {
    // Verificar si hay sesión activa
    if (!req.session.isAuthenticated || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'No hay sesión activa',
      });
    }

    // Retornar datos del usuario desde la sesión
    res.status(200).json({
      success: true,
      user: req.session.user,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/logout
 * Cerrar sesión y destruir la cookie
 */
const logout = async (req, res) => {
  try {
    // Destruir sesión
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir sesión:', err);
        return res.status(500).json({
          success: false,
          message: 'Error al cerrar sesión',
        });
      }

      // Limpiar cookie
      res.clearCookie('connect.sid');

      res.status(200).json({
        success: true,
        message: 'Logout exitoso',
      });
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar logout',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/register
 * Registro deshabilitado - Solo admin puede acceder
 */
const register = async (req, res) => {
  res.status(403).json({
    success: false,
    message: 'El registro está deshabilitado. Solo el administrador puede acceder al sistema.',
  });
};

module.exports = {
  login,
  register,
  getMe,
  logout,
};
