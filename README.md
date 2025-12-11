# Blex Dashboard Backend

Backend API para el Dashboard de Blex construido con Node.js, Express y PostgreSQL.

## Tecnologías

- **Node.js** (v18+)
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **pg** - Cliente PostgreSQL
- **dotenv** - Manejo de variables de entorno
- **helmet** - Seguridad HTTP
- **cors** - Manejo de CORS
- **morgan** - Logger de requests

## Estructura del Proyecto

```
dashboard-blex-bkend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── controllers/
│   │   ├── healthController.js  # Health check endpoint
│   │   └── productsController.js # CRUD de productos
│   ├── middleware/
│   │   └── errorHandler.js      # Manejo de errores global
│   ├── routes/
│   │   └── index.js             # Definición de rutas
│   └── index.js                 # Punto de entrada del servidor
├── .env                         # Variables de entorno (NO COMMITEAR)
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## Instalación

1. **Clonar el repositorio** (si aplica)

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   - Copiar `.env.example` a `.env`
   - Actualizar las credenciales de la base de datos

4. **Verificar conexión a la base de datos**:
   - Asegúrate de que tu base de datos PostgreSQL esté corriendo
   - Verifica que las credenciales en `.env` sean correctas

## Uso

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:3001` (o el puerto configurado en `.env`)

## Endpoints Disponibles

### Health Check
- **GET** `/api/health` - Verificar estado del servidor y conexión a DB

### Productos

- **GET** `/api/products` - Obtener todos los productos
  - Query params: `?limit=100&offset=0`

- **GET** `/api/products/:id` - Obtener producto por ID

- **POST** `/api/products` - Crear nuevo producto
  ```json
  {
    "name": "Producto 1",
    "description": "Descripción del producto",
    "price": 99.99,
    "stock": 10
  }
  ```

- **PUT** `/api/products/:id` - Actualizar producto
  ```json
  {
    "name": "Producto actualizado",
    "price": 149.99
  }
  ```

- **DELETE** `/api/products/:id` - Eliminar producto

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `PORT` | Puerto del servidor | `3001` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3000` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_DATABASE` | Nombre de la base de datos | `postgres` |
| `DB_USERNAME` | Usuario de la base de datos | `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos | `password` |

## Esquema de Base de Datos

### Tabla: `products`

```sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Próximos Pasos

1. **Crear la tabla `products`** en tu base de datos (si no existe)
2. **Probar los endpoints** con Postman o Thunder Client
3. **Conectar el frontend** para consumir la API
4. **Agregar autenticación** (JWT) si es necesario
5. **Deploy con Genezio** o tu plataforma preferida

## Seguridad

- Helmet.js para headers de seguridad HTTP
- CORS configurado para orígenes específicos
- Validación de inputs en endpoints
- Manejo de errores centralizado
- Variables de entorno para credenciales

## Notas Importantes

- **NUNCA** commitear el archivo `.env` con credenciales reales
- Usar `.env.example` como plantilla
- La conexión a AWS RDS requiere `ssl: { rejectUnauthorized: false }`
- El pool de conexiones está limitado a 20 conexiones máximo

## Soporte

Para problemas o preguntas, contactar al equipo de desarrollo de Blex.
