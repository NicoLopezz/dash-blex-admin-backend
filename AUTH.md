# 🔐 Autenticación - Blex Dashboard API

Sistema de autenticación simple con cookies de sesión cifradas para el dashboard de Blex.

---

## 📝 Credenciales de Acceso

### Usuario Administrador

Las credenciales se configuran en el archivo `.env`:

```env
ADMIN_EMAIL=admin@blexgroup.com
ADMIN_PASSWORD=nano2025
```

**Valores por defecto** (si no están en .env):
```
Email:    admin@blexgroup.com
Password: nano2025
```

⚠️ **Nota de Seguridad:** Sistema simple para desarrollo. En producción deberían implementarse credenciales seguras y un sistema de autenticación robusto.

---

## 🔑 Endpoints de Autenticación

### 1. POST /api/auth/login

Iniciar sesión y crear cookie de sesión cifrada.

**Request:**
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@blexgroup.com",
  "password": "admin"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "name": "Administrador Blex",
    "email": "admin@blexgroup.com",
    "role": "admin"
  }
}
```

**Response (401 Unauthorized) - Credenciales inválidas:**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

**Response (400 Bad Request) - Faltan datos:**
```json
{
  "success": false,
  "message": "Email y password son requeridos"
}
```

---

### 2. GET /api/auth/me

Obtener información del usuario autenticado desde la sesión.

**Request:**
```bash
GET http://localhost:3001/api/auth/me
Cookie: connect.sid=s%3A... (se envía automáticamente por el navegador)
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "Administrador Blex",
    "email": "admin@blexgroup.com",
    "role": "admin"
  }
}
```

**Response (401 Unauthorized) - Sin sesión activa:**
```json
{
  "success": false,
  "message": "No hay sesión activa"
}
```

---

### 3. POST /api/auth/logout

Cerrar sesión y destruir cookie.

**Request:**
```bash
POST http://localhost:3001/api/auth/logout
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

---

## 🛡️ Cookies de Sesión Cifradas

### ¿Cómo funciona?

1. **Login:** El usuario envía email y password a `/api/auth/login`
2. **Sesión:** El servidor crea una sesión cifrada y envía cookie `connect.sid` al cliente
3. **Requests:** El navegador incluye automáticamente la cookie en todas las peticiones
4. **Verificación:** El servidor verifica la sesión en cada request (si el endpoint lo requiere)
5. **Logout:** Se destruye la sesión y se limpia la cookie

### Configuración de la Cookie

```javascript
{
  secret: process.env.SESSION_SECRET || 'blex-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS en producción
    httpOnly: true, // No accesible desde JavaScript
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}
```

---

## 💻 Implementación en Frontend

### JavaScript Vanilla

```javascript
// Login
async function login(email, password) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // IMPORTANTE: Incluir cookies
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    // Cookie se guarda automáticamente
    return data;
  } else {
    throw new Error(data.message);
  }
}

// Hacer request autenticado
async function fetchWithAuth(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // IMPORTANTE: Incluir cookies
  });

  return response.json();
}

// Logout
async function logout() {
  await fetch('http://localhost:3001/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  window.location.href = '/login';
}

// Verificar sesión
async function checkAuth() {
  const response = await fetch('http://localhost:3001/api/auth/me', {
    credentials: 'include',
  });

  const data = await response.json();

  if (!data.success) {
    window.location.href = '/login';
  }

  return data.user;
}
```

### React

```javascript
import { useState, useEffect } from 'react';

// Hook personalizado para autenticación
function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      setUser(data.user);
      return data;
    } else {
      throw new Error(data.message);
    }
  };

  const logout = async () => {
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setUser(null);
  };

  return { user, loading, login, logout, checkSession };
}

// Componente de Login
function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@blexgroup.com');
  const [password, setPassword] = useState('nano2025');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Iniciar Sesión</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

// Componente protegido
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return children;
}
```

### Axios con Cookies

```javascript
import axios from 'axios';

// Configurar axios para incluir cookies automáticamente
axios.defaults.withCredentials = true;

// Configurar base URL
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
});

// Manejar errores 401 (sesión expirada)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Uso
async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
}

async function getUsers() {
  const response = await api.get('/users');
  return response.data;
}

async function logout() {
  await api.post('/auth/logout');
  window.location.href = '/login';
}
```

---

## 🔒 Seguridad

### Configuración de Sesión

Las cookies se configuran en las variables de entorno:

```env
SESSION_SECRET=tu-secret-para-cookies-cambialo-en-produccion
ADMIN_EMAIL=admin@blexgroup.com
ADMIN_PASSWORD=admin
```

### Características de Seguridad

1. **Cookies cifradas:** La sesión se almacena cifrada usando `SESSION_SECRET`
2. **httpOnly:** Las cookies no son accesibles desde JavaScript del cliente (protección contra XSS)
3. **secure:** En producción (HTTPS), las cookies solo se envían por conexión segura
4. **maxAge:** La sesión expira en 24 horas automáticamente
5. **CORS con credentials:** El servidor acepta cookies de `CORS_ORIGIN` configurado

### Mejores Prácticas

1. **HTTPS:** En producción, usar siempre HTTPS para que `secure: true` funcione
2. **SESSION_SECRET:** Cambiar a un valor aleatorio y seguro de al menos 32 caracteres
3. **CORS_ORIGIN:** Configurar el origen exacto del frontend (no usar '*')
4. **Credenciales:** Cambiar ADMIN_EMAIL y ADMIN_PASSWORD en producción

---

## 🧪 Testing con cURL

```bash
# Login exitoso (guarda cookie en archivo)
curl -c cookies.txt -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blexgroup.com","password":"nano2025"}'

# Login fallido
curl -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@blexgroup.com","password":"wrong"}'

# Obtener info del usuario (usa cookie guardada)
curl -b cookies.txt "http://localhost:3001/api/auth/me"

# Logout (usa cookie guardada)
curl -b cookies.txt -c cookies.txt -X POST "http://localhost:3001/api/auth/logout"
```

---

## 📊 Endpoints Protegidos (Opcional)

Actualmente **todos los endpoints están públicos** excepto `/api/auth/me`.

Si quieres proteger algún endpoint, puedes verificar la sesión manualmente:

```javascript
// Middleware de verificación de sesión
const requireAuth = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Sesión no válida o expirada',
    });
  }
  next();
};

// Endpoint protegido
router.get('/users', requireAuth, usersController.getAllUsers);
```

---

## ⚙️ Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env`:

```env
# Autenticación
ADMIN_EMAIL=admin@blexgroup.com
ADMIN_PASSWORD=admin
SESSION_SECRET=cambia-este-secret-en-produccion-usa-algo-muy-largo-y-aleatorio

# CORS (importante para cookies cross-origin)
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 Diferencias con JWT

| JWT (Anterior) | Sessions (Actual) |
|----------------|------------------|
| Token en localStorage | Cookie httpOnly |
| Cliente maneja el token | Navegador maneja automáticamente |
| Vulnerable a XSS | Protegido contra XSS |
| Sin estado en servidor | Estado en servidor (express-session) |
| Header: Authorization: Bearer | Cookie: connect.sid |

---

## 🚀 Próximos Pasos (Opcional)

Si quieres mejorar el sistema de autenticación:

1. **Store persistente:** Redis o base de datos para sesiones (en lugar de memoria)
2. **Base de datos:** Conectar con tabla `users` real
3. **Bcrypt:** Hash de passwords
4. **Roles:** Sistema de permisos por rol
5. **2FA:** Autenticación de dos factores
6. **Rate Limiting:** Limitar intentos de login
7. **CSRF Protection:** Tokens CSRF para protección adicional

---

**✅ Login implementado y funcionando!**

Credenciales configurables en `.env`:
- `ADMIN_EMAIL` (default: `admin@blexgroup.com`)
- `ADMIN_PASSWORD` (default: `admin`)

Sistema basado en cookies de sesión cifradas con `express-session`.
