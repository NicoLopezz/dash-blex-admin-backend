# Documentación de API Endpoints - Blex Dashboard Backend

Esta documentación describe todos los endpoints disponibles en la API del dashboard de Blex.

## URL Base

```
http://localhost:3001/api
```

---

## 1. GESTIÓN DE USUARIOS

### GET /api/users
Obtener lista de todos los usuarios con paginación y filtros.

**Query Parameters:**
- `search` (opcional): string - Filtrar por nombre, email, CUIT o CVU
- `status` (opcional): string - Filtrar por estado (active, limited, inactive, etc.)
- `page` (opcional): number - Página actual (default: 1)
- `limit` (opcional): number - Cantidad por página (default: 10)

**Response:**
```json
{
  "users": [
    {
      "id": "6367",
      "nombre": "DI FILIPPO FERNANDO GABRIEL",
      "cuit": "20200055846",
      "email": "ferdifilippo@gmail.com",
      "cvu": "0000240200000000063678",
      "estado": "limited",
      "fechaRegistro": "05/12/2025",
      "balanceARS": "0.00",
      "balanceUSD": "0"
    }
  ],
  "total": 5300,
  "page": 1,
  "totalPages": 1767
}
```

**Ejemplo de uso:**
```bash
curl "http://localhost:3001/api/users?search=Fernando&limit=5"
```

---

### GET /api/users/:id
Obtener detalle completo de un usuario específico.

**Path Parameters:**
- `id` (requerido): number - ID del usuario

**Response:**
```json
{
  "id": "2693",
  "nombre": "FERNANDEZ PABLO DANIEL",
  "cuit": "20302797782",
  "email": "pablofernandez1983@gmail.com",
  "cvu": "0000240200000000026932",
  "estado": "limited",
  "fechaRegistro": "08/12/2024",
  "balanceARS": "0.00",
  "balanceUSD": "0"
}
```

**Ejemplo de uso:**
```bash
curl "http://localhost:3001/api/users/2693"
```

---

### GET /api/users/:userId/transactions
Obtener todas las transacciones de un usuario específico.

**Path Parameters:**
- `userId` (requerido): number - ID del usuario

**Query Parameters:**
- `page` (opcional): number - Página actual (default: 1)
- `limit` (opcional): number - Cantidad por página (default: 50)
- `startDate` (opcional): string (ISO date) - Fecha inicial
- `endDate` (opcional): string (ISO date) - Fecha final
- `tipo` (opcional): string - Tipo de transacción
- `moneda` (opcional): "ARS" | "USD" | "BRL" - Moneda

**Response:**
```json
{
  "transactions": [
    {
      "id": 1001,
      "fecha": "2025-12-10T14:30:00Z",
      "tipo": "deposit",
      "moneda": "ARS",
      "monto": 500000.00,
      "confirmado": true
    }
  ],
  "total": 50,
  "page": 1
}
```

**Tipos de transacción válidos:**
- `deposit` - Depósito
- `withdraw` - Retiro
- `transfer:sent_ars` - Transferencia ARS enviada
- `transfer:received_ars` - Transferencia ARS recibida
- `transfer:sent_usd` - Transferencia USD enviada
- `transfer:received_usd` - Transferencia USD recibida
- `exchange_buy` - Compra de moneda extranjera
- `exchange_sell` - Venta de moneda extranjera

**Ejemplo de uso:**
```bash
curl "http://localhost:3001/api/users/2693/transactions?limit=10&moneda=ARS"
```

---

### POST /api/users
Crear nuevo usuario.

**Request Body:**
```json
{
  "nombre": "Juan Pérez",
  "cuit": "20-10000000-0",
  "email": "juan.perez@gmail.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "cuit": "20-10000000-0",
    "email": "juan.perez@gmail.com",
    "estado": "active",
    "fechaRegistro": "11/12/2025"
  }
}
```

---

### PUT /api/users/:id
Actualizar datos de usuario.

**Path Parameters:**
- `id` (requerido): number - ID del usuario

**Request Body:**
```json
{
  "nombre": "Juan Pérez Actualizado",
  "email": "nuevo.email@gmail.com",
  "estado": "inactive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez Actualizado",
    "email": "nuevo.email@gmail.com",
    "estado": "inactive",
    "fechaActualizacion": "11/12/2025"
  }
}
```

---

### DELETE /api/users/:id
Desactivar usuario (soft delete).

**Path Parameters:**
- `id` (requerido): number - ID del usuario

**Response:**
```json
{
  "success": true,
  "message": "Usuario desactivado exitosamente",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "estado": "inactive"
  }
}
```

---

## 2. DASHBOARD / ESTADÍSTICAS

### GET /api/dashboard/stats
Obtener estadísticas generales del sistema.

**Response:**
```json
{
  "usuariosActivos": 0,
  "usuariosInactivos": 5300,
  "balanceTotalARS": 11935163.13,
  "balanceTotalUSD": 0,
  "balanceTotalBRL": 0,
  "balanceTotalUSDC": 393345
}
```

**Ejemplo de uso:**
```bash
curl "http://localhost:3001/api/dashboard/stats"
```

---

### GET /api/dashboard/chart/monthly-movement
Obtener datos para el gráfico de movimiento mensual.

**Query Parameters:**
- `moneda` (requerido): "ARS" | "USD" | "BRL" - Moneda a consultar
- `year` (opcional): number - Año (default: año actual)

**Response:**
```json
{
  "labels": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  "data": [559878035.8, 201574585.88, 77834546.16, 48233991.03, 142074667.82, 103579470.35, 4445975550.06, 23286942.47, 2552734044.81, 287521483.05, 21760769.6, 2627044.35],
  "label": "Pesos Argentinos (ARS)"
}
```

**Ejemplo de uso:**
```bash
curl "http://localhost:3001/api/dashboard/chart/monthly-movement?moneda=ARS&year=2025"
```

---

## 3. TRANSACCIONES

### GET /api/transactions/recent
Obtener actividad reciente global del sistema.

**Query Parameters:**
- `limit` (opcional): number - Cantidad de transacciones (default: 5)

**Response:**
```json
{
  "transactions": [
    {
      "usuario": "ARRATIA GARRIDO ADRIANA BELEN",
      "cvu": null,
      "fecha": "11/12/2025",
      "tipo": "Depósito",
      "moneda": "ARS",
      "monto": "650.00"
    },
    {
      "usuario": "MONTIEL BARBARA MARIA",
      "cvu": null,
      "fecha": "10/12/2025",
      "tipo": "Depósito",
      "moneda": "ARS",
      "monto": "120000.00"
    }
  ]
}
```

**Ejemplo de uso:**
```bash
curl "http://localhost:3001/api/transactions/recent?limit=10"
```

---

### GET /api/transactions
Obtener transacciones con información de usuarios y wallets.

**Query Parameters:**
- `startDate` (opcional): string - Fecha inicial (default: 2025-01-01)
- `userId` (opcional): number - Filtrar por usuario
- `currency` (opcional): string - Filtrar por moneda

**Response:**
```json
{
  "success": true,
  "count": 150,
  "filters": {
    "startDate": "2025-01-01",
    "userId": "all",
    "currency": "ARS"
  },
  "data": [
    {
      "user_id": "1",
      "user_name": "Juan Pérez",
      "email": "juan@example.com",
      "cuit": "20-10000000-0",
      "currency": "ARS",
      "current_balance": 2450000.00,
      "transaction_id": 1001,
      "transaction_type": "deposit",
      "amount": 500000.00,
      "confirmed": true,
      "concept": "Depósito",
      "description": "Depósito inicial",
      "transaction_date": "2025-12-10T14:30:00Z"
    }
  ]
}
```

---

### GET /api/transactions/summary
Obtener resumen de transacciones por usuario.

**Query Parameters:**
- `startDate` (opcional): string - Fecha inicial (default: 2025-01-01)

**Response:**
```json
{
  "success": true,
  "count": 50,
  "startDate": "2025-01-01",
  "data": [
    {
      "user_id": "1",
      "user_name": "Juan Pérez",
      "email": "juan@example.com",
      "total_transactions": 150,
      "confirmed_transactions": 145,
      "pending_transactions": 5,
      "wallets": [
        {
          "currency": "ARS",
          "balance": 2450000.00
        },
        {
          "currency": "USD",
          "balance": 1800.00
        }
      ]
    }
  ]
}
```

---

### GET /api/transactions/by-currency
Obtener estadísticas de transacciones por moneda.

**Query Parameters:**
- `startDate` (opcional): string - Fecha inicial (default: 2025-01-01)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "startDate": "2025-01-01",
  "data": [
    {
      "currency": "ARS",
      "total_transactions": 1500,
      "unique_users": 50,
      "total_deposits": 12500000.00,
      "total_withdrawals": 5000000.00,
      "total_balance": 11935163.13
    }
  ]
}
```

---

### POST /api/transactions
Crear nueva transacción.

**Request Body:**
```json
{
  "userId": 1,
  "tipo": "deposit",
  "moneda": "ARS",
  "monto": 50000.00,
  "descripcion": "Depósito de prueba"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transacción creada exitosamente",
  "data": {
    "id": 1002,
    "fecha": "2025-12-11T15:30:00Z",
    "tipo": "deposit",
    "monto": 50000.00,
    "confirmado": true,
    "moneda": "ARS"
  }
}
```

---

## 4. BILLING / FACTURACIÓN

### GET /api/invoices
Obtener lista de facturas.

**Query Parameters:**
- `limit` (opcional): number - Cantidad de facturas (default: 5)

**Response:**
```json
{
  "invoices": [
    {
      "id": "#MS-415646",
      "date": "March, 01, 2020",
      "price": "$180"
    },
    {
      "id": "#RV-126749",
      "date": "February, 10, 2021",
      "price": "$250"
    }
  ]
}
```

**Nota:** Este endpoint actualmente devuelve datos mock. La funcionalidad real de facturación está pendiente de implementación.

---

### GET /api/billing/transactions
Obtener transacciones de billing/pagos.

**Response:**
```json
{
  "newest": [
    {
      "name": "Netflix",
      "description": "27 March 2020, at 12:30 PM",
      "value": "- $ 2,500",
      "type": "expense"
    },
    {
      "name": "Apple",
      "description": "27 March 2020, at 04:30 AM",
      "value": "+ $ 2,000",
      "type": "income"
    }
  ],
  "yesterday": [
    {
      "name": "Stripe",
      "description": "26 March 2020, at 13:45 PM",
      "value": "+ $ 750",
      "type": "income"
    }
  ]
}
```

**Nota:** Este endpoint actualmente devuelve datos mock. La funcionalidad real de billing está pendiente de implementación.

---

## 5. UTILIDADES

### GET /api/health
Health check del servidor y conexión a base de datos.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-12-11T18:05:48.616Z",
  "database": "connected",
  "uptime": 34.337401584,
  "environment": "development"
}
```

---

### GET /api/debug/schema
Obtener estructura de una tabla de la base de datos (solo para desarrollo).

**Query Parameters:**
- `tableName` (opcional): string - Nombre de la tabla (default: users)

**Response:**
```json
{
  "table": "users",
  "columns": [
    {
      "column_name": "id",
      "data_type": "bigint",
      "is_nullable": "NO"
    },
    {
      "column_name": "name",
      "data_type": "character varying",
      "is_nullable": "NO"
    }
  ]
}
```

---

### GET /api/debug/sample
Obtener datos de muestra de una tabla (solo para desarrollo).

**Query Parameters:**
- `tableName` (opcional): string - Nombre de la tabla (default: users)
- `limit` (opcional): number - Cantidad de registros (default: 1)

**Response:**
```json
{
  "table": "users",
  "count": 1,
  "sample": [
    {
      "id": "2693",
      "name": "FERNANDEZ PABLO DANIEL",
      "email": "pablofernandez1983@gmail.com"
    }
  ]
}
```

---

## Códigos de Estado HTTP

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Datos de entrada inválidos
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: email duplicado)
- `500 Internal Server Error` - Error del servidor

---

## Modelos de Datos

### User Model
```typescript
{
  id: number;
  nombre: string;
  cuit: string;           // Formato: "20-10000000-0"
  email: string;
  cvu: string;            // Formato: "0000003100000000000001" (22 dígitos)
  balanceARS: number;     // Float con 2 decimales
  balanceUSD: number;     // Float con 2 decimales
  estado: string;         // "active", "limited", "inactive", etc.
  fechaRegistro: string;  // Formato: "DD/MM/YYYY"
}
```

### Transaction Model
```typescript
{
  id: number;
  fecha: string;          // ISO 8601: "2025-12-10T14:30:00Z"
  tipo: TransactionType;  // deposit, withdraw, transfer:*, exchange_*
  moneda: "ARS" | "USD" | "BRL";
  monto: number;          // Float (negativo para salidas, positivo para entradas)
  confirmado: boolean;
}
```

---

## Prioridades de Implementación

### 🔴 ALTA (Ya implementado)
- ✅ GET /api/users
- ✅ GET /api/users/:id
- ✅ GET /api/users/:userId/transactions
- ✅ GET /api/dashboard/stats
- ✅ GET /api/dashboard/chart/monthly-movement

### 🟡 MEDIA (Ya implementado)
- ✅ GET /api/transactions/recent
- ✅ POST /api/users
- ✅ PUT /api/users/:id
- ✅ POST /api/transactions

### 🟢 BAJA (Implementado con datos mock)
- ✅ GET /api/invoices
- ✅ GET /api/billing/transactions

---

## Notas Adicionales

1. **Paginación**: Todos los endpoints que devuelven listas soportan paginación mediante los parámetros `page` y `limit`.

2. **Filtros**: Los endpoints de búsqueda soportan búsqueda case-insensitive mediante el operador ILIKE de PostgreSQL.

3. **Fechas**: Todas las fechas se manejan en formato ISO 8601 internamente, pero se formatean como "DD/MM/YYYY" en las respuestas para visualización.

4. **Montos**: Los montos se almacenan en centavos en la base de datos y se convierten a decimales (dividiendo por 100) en las respuestas de la API.

5. **Estados de cuenta**: Los estados válidos incluyen: `active`, `limited`, `inactive`, `closed`, entre otros.

---

Para más información sobre la configuración del servidor, consulta el archivo [README.md](./README.md).
