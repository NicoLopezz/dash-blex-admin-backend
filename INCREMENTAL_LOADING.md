# 📡 Carga Incremental de Datos - Guía de Implementación

Esta guía explica cómo cargar datos de manera incremental para evitar traer toda la información en cada consulta, optimizando el rendimiento y la experiencia del usuario.

---

## 🎯 Problema que Resuelve

**Problema:** El usuario tiene miles de transacciones. Cargar todas en cada request es ineficiente.

**Solución:** Implementamos **3 estrategias** de carga incremental:

1. **Cursor-Based Pagination** - Para infinite scroll
2. **Polling desde timestamp** - Para actualizaciones en tiempo real
3. **Offset Pagination** - Para paginación tradicional (ya implementado)

---

## 1️⃣ Cursor-Based Pagination (Infinite Scroll)

### 📌 Endpoint
```
GET /api/users/:userId/transactions/incremental
```

### ✅ Ventajas
- ⚡ Más rápido que offset pagination
- 🎯 No duplica datos al agregar nuevos registros
- 📱 Ideal para infinite scroll en mobile/web
- 🔄 Permite navegar hacia adelante y atrás

### 📊 Cómo Funciona

El cursor es un **timestamp o ID** que marca el último elemento visto. Solo trae datos después/antes de ese punto.

### 🔧 Parámetros

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `cursor` | string | null | Timestamp ISO o ID de la última transacción vista |
| `limit` | number | 20 | Cantidad de resultados a traer |
| `direction` | string | 'older' | `older` (más antiguas) o `newer` (más nuevas) |
| `moneda` | string | - | Filtrar por moneda (ARS, USD, BRL) |
| `tipo` | string | - | Filtrar por tipo de transacción |

### 📝 Ejemplo 1: Carga Inicial (Primera Vez)

**Request:**
```bash
GET /api/users/2693/transactions/incremental?limit=20
```

**Response:**
```json
{
  "transactions": [
    {
      "id": 5000,
      "fecha": "2025-12-11T15:30:00Z",
      "tipo": "deposit",
      "moneda": "ARS",
      "monto": 50000.00,
      "confirmado": true
    },
    {
      "id": 4999,
      "fecha": "2025-12-11T14:20:00Z",
      "tipo": "withdraw",
      "moneda": "ARS",
      "monto": -20000.00,
      "confirmado": true
    }
    // ... 18 transacciones más (20 total)
  ],
  "count": 20,
  "hasMore": true,
  "cursors": {
    "next": "2025-12-10T10:15:00Z",  // Cursor para cargar más antiguas
    "prev": "2025-12-11T15:30:00Z"   // Cursor para cargar más nuevas
  }
}
```

### 📝 Ejemplo 2: Cargar Más (Scroll Down)

Usuario hace scroll hacia abajo, necesita **transacciones más antiguas**.

**Request:**
```bash
GET /api/users/2693/transactions/incremental?cursor=2025-12-10T10:15:00Z&direction=older&limit=20
```

**Response:**
```json
{
  "transactions": [
    // Solo transacciones ANTERIORES a 2025-12-10T10:15:00Z
    {
      "id": 4980,
      "fecha": "2025-12-10T09:00:00Z",
      "tipo": "deposit",
      "moneda": "ARS",
      "monto": 30000.00,
      "confirmado": true
    }
    // ... 19 más
  ],
  "count": 20,
  "hasMore": true,
  "cursors": {
    "next": "2025-12-09T18:45:00Z",
    "prev": "2025-12-10T09:00:00Z"
  }
}
```

### 📝 Ejemplo 3: Actualizar (Pull to Refresh)

Usuario hace pull-to-refresh, necesita **transacciones nuevas**.

**Request:**
```bash
GET /api/users/2693/transactions/incremental?cursor=2025-12-11T15:30:00Z&direction=newer&limit=20
```

**Response:**
```json
{
  "transactions": [
    // Solo transacciones POSTERIORES a 2025-12-11T15:30:00Z
    {
      "id": 5002,
      "fecha": "2025-12-11T16:45:00Z",
      "tipo": "transfer:received_ars",
      "moneda": "ARS",
      "monto": 75000.00,
      "confirmado": true
    },
    {
      "id": 5001,
      "fecha": "2025-12-11T16:00:00Z",
      "tipo": "deposit",
      "moneda": "ARS",
      "monto": 10000.00,
      "confirmado": true
    }
  ],
  "count": 2,
  "hasMore": false,
  "cursors": {
    "next": "2025-12-11T16:00:00Z",
    "prev": "2025-12-11T16:45:00Z"
  }
}
```

---

## 2️⃣ Polling desde Timestamp (Actualizaciones en Tiempo Real)

### 📌 Endpoint
```
GET /api/users/:userId/transactions/since
```

### ✅ Ventajas
- 🔔 Detecta nuevas transacciones automáticamente
- 💡 Más simple que WebSockets
- 🔋 Menor consumo de recursos que polling completo
- ⏱️ Control preciso de actualizaciones

### 🔧 Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `since` | string | ✅ Sí | Timestamp ISO desde cuando buscar |
| `moneda` | string | ❌ No | Filtrar por moneda |

### 📝 Ejemplo: Polling cada 5 segundos

**Escenario:** El dashboard está abierto y quieres mostrar nuevas transacciones automáticamente.

**Request Inicial:**
```bash
GET /api/users/2693/transactions/since?since=2025-12-11T15:00:00Z
```

**Response (sin transacciones nuevas):**
```json
{
  "newTransactions": [],
  "count": 0,
  "lastChecked": "2025-12-11T15:05:00Z"
}
```

**5 segundos después, nueva transacción aparece:**

**Request:**
```bash
GET /api/users/2693/transactions/since?since=2025-12-11T15:05:00Z
```

**Response:**
```json
{
  "newTransactions": [
    {
      "id": 5003,
      "fecha": "2025-12-11T15:07:30Z",
      "tipo": "deposit",
      "moneda": "ARS",
      "monto": 100000.00,
      "confirmado": true
    }
  ],
  "count": 1,
  "lastChecked": "2025-12-11T15:10:00Z"
}
```

### 💻 Implementación en Frontend (React Example)

```javascript
import { useState, useEffect } from 'react';

function TransactionsList({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [lastCheck, setLastCheck] = useState(new Date().toISOString());

  // Polling cada 5 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(
        `/api/users/${userId}/transactions/since?since=${lastCheck}`
      );
      const data = await response.json();

      if (data.count > 0) {
        // Agregar nuevas transacciones al inicio
        setTransactions(prev => [...data.newTransactions, ...prev]);

        // Notificar al usuario
        showNotification(`${data.count} nueva(s) transacción(es)`);
      }

      setLastCheck(data.lastChecked);
    }, 5000); // Cada 5 segundos

    return () => clearInterval(interval);
  }, [userId, lastCheck]);

  return (
    <div>
      {transactions.map(tx => (
        <TransactionItem key={tx.id} transaction={tx} />
      ))}
    </div>
  );
}
```

---

## 3️⃣ Comparación de Estrategias

| Característica | Offset Pagination | Cursor Pagination | Polling desde Timestamp |
|----------------|-------------------|-------------------|------------------------|
| **Uso Principal** | Paginación tradicional | Infinite scroll | Actualizaciones tiempo real |
| **Performance** | 🟡 Medio (lento con páginas altas) | 🟢 Rápido | 🟢 Muy rápido |
| **Duplicados** | 🔴 Posibles al agregar datos | 🟢 No hay | 🟢 No hay |
| **Navegación** | ✅ Saltar a cualquier página | ⚠️ Solo siguiente/anterior | ❌ Solo nuevas |
| **Complejidad** | 🟢 Simple | 🟡 Media | 🟢 Simple |
| **Caso de Uso** | Tablas con páginas | Mobile apps, feeds | Dashboards en vivo |

---

## 📱 Casos de Uso Recomendados

### 1. Dashboard Principal (Desktop)
- **Primera carga:** Offset pagination (`/users/:id/transactions?page=1&limit=50`)
- **Actualización:** Polling (`/users/:id/transactions/since`)
- **Navegar historial:** Offset pagination con páginas

### 2. App Mobile
- **Primera carga:** Cursor pagination (`/users/:id/transactions/incremental?limit=20`)
- **Scroll down:** Cursor con `direction=older`
- **Pull to refresh:** Cursor con `direction=newer`

### 3. Tabla con Filtros
- **Todas las vistas:** Offset pagination
- **Razón:** Permite saltar a cualquier página directamente

### 4. Feed Infinito (Tipo Twitter/Instagram)
- **Primera carga:** Cursor pagination
- **Scroll infinito:** Cursor con `direction=older`
- **Nuevas publicaciones:** Polling o cursor con `direction=newer`

---

## 🔧 Configuración de Frontend

### Ejemplo con React Query (Recomendado)

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';

function useInfiniteTransactions(userId) {
  return useInfiniteQuery({
    queryKey: ['transactions', userId],
    queryFn: async ({ pageParam = null }) => {
      const url = pageParam
        ? `/api/users/${userId}/transactions/incremental?cursor=${pageParam}&limit=20`
        : `/api/users/${userId}/transactions/incremental?limit=20`;

      const response = await fetch(url);
      return response.json();
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursors.next : undefined,
  });
}

// Uso en componente
function TransactionsList({ userId }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions(userId);

  return (
    <div>
      {data?.pages.map((page) =>
        page.transactions.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))
      )}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
}
```

---

## 🎨 Ejemplo Completo: Infinite Scroll

### Frontend (React + Intersection Observer)

```javascript
import { useEffect, useRef } from 'react';

function InfiniteTransactionsList({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);

  // Función para cargar más transacciones
  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const url = cursor
        ? `/api/users/${userId}/transactions/incremental?cursor=${cursor}&limit=20`
        : `/api/users/${userId}/transactions/incremental?limit=20`;

      const response = await fetch(url);
      const data = await response.json();

      setTransactions(prev => [...prev, ...data.transactions]);
      setCursor(data.cursors.next);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer para detectar scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  // Carga inicial
  useEffect(() => {
    loadMore();
  }, [userId]);

  return (
    <div>
      {transactions.map((tx) => (
        <TransactionItem key={tx.id} transaction={tx} />
      ))}

      {/* Elemento que activa la carga */}
      <div ref={observerRef} style={{ height: '20px' }}>
        {loading && <LoadingSpinner />}
      </div>

      {!hasMore && <p>No hay más transacciones</p>}
    </div>
  );
}
```

---

## ⚡ Optimizaciones y Mejores Prácticas

### 1. Caching en Frontend
```javascript
// Guardar en localStorage para persistir entre sesiones
localStorage.setItem(`transactions_${userId}`, JSON.stringify(transactions));
localStorage.setItem(`cursor_${userId}`, cursor);
```

### 2. Debouncing en Polling
```javascript
// No hacer polling si el usuario está inactivo
let lastActivity = Date.now();

document.addEventListener('mousemove', () => {
  lastActivity = Date.now();
});

setInterval(() => {
  const inactive = Date.now() - lastActivity > 60000; // 1 minuto
  if (!inactive) {
    checkNewTransactions();
  }
}, 5000);
```

### 3. Rate Limiting
```javascript
// Máximo 1 request cada 3 segundos
let lastRequest = 0;

async function loadTransactions() {
  const now = Date.now();
  if (now - lastRequest < 3000) {
    console.log('Rate limited, waiting...');
    return;
  }
  lastRequest = now;

  // ... fetch data
}
```

---

## 🧪 Testing de Endpoints

### Test 1: Carga Incremental Básica
```bash
# Primera carga
curl "http://localhost:3001/api/users/2693/transactions/incremental?limit=5"

# Segunda carga (usando cursor del response anterior)
curl "http://localhost:3001/api/users/2693/transactions/incremental?cursor=2025-12-10T14:30:00Z&limit=5"
```

### Test 2: Polling
```bash
# Primera consulta
curl "http://localhost:3001/api/users/2693/transactions/since?since=2025-12-11T00:00:00Z"

# Esperar 5 segundos y consultar nuevamente
sleep 5
curl "http://localhost:3001/api/users/2693/transactions/since?since=2025-12-11T15:10:00Z"
```

### Test 3: Cargar Nuevas
```bash
# Obtener transacciones más recientes que cierta fecha
curl "http://localhost:3001/api/users/2693/transactions/incremental?cursor=2025-12-11T15:00:00Z&direction=newer&limit=10"
```

---

## 📊 Resumen de Endpoints

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/users/:id/transactions` | GET | Paginación tradicional (offset) |
| `/api/users/:id/transactions/incremental` | GET | **Infinite scroll con cursor** |
| `/api/users/:id/transactions/since` | GET | **Polling para nuevas transacciones** |

---

## 🎯 Recomendación Final

**Para tu dashboard de Blex:**

1. **Vista de Tabla (Desktop):**
   - Usa paginación offset tradicional
   - Permite navegación rápida por páginas

2. **Vista de Feed (Mobile):**
   - Usa cursor pagination para infinite scroll
   - Implementa pull-to-refresh con `direction=newer`

3. **Actualizaciones en Vivo:**
   - Implementa polling cada 10-30 segundos
   - Solo cuando la pestaña esté activa
   - Muestra notificación cuando haya nuevas transacciones

---

**¿Preguntas?** Consulta [API_ENDPOINTS.md](./API_ENDPOINTS.md) para más información sobre los endpoints.
