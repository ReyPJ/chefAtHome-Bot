# 🤖 WhatsApp Restaurant Bot - ChefAtHome

Bot conversacional de WhatsApp para 5 restaurantes en México usando **WhatsApp Business Cloud API**.

## 📋 Descripción

Chatbot production-ready que permite a usuarios hacer pedidos completos de comida desde WhatsApp. El bot maneja todo el flujo desde la selección del restaurante hasta la confirmación del pedido, con persistencia en **PostgreSQL** y soporte para atención humana.

## 🚀 Características

- ✅ Conversación natural en español (México)
- ✅ 5 restaurantes con menús completos
- ✅ Gestión de carrito de compras
- ✅ Sistema de sesiones en memoria
- ✅ Detección de clientes frecuentes
- ✅ Cálculo de costos de envío por zonas
- ✅ Mensajes interactivos (listas y botones)
- ✅ Keywords especiales (MENU, CARRITO, CANCELAR, AYUDA, HUMANO)
- ✅ **Persistencia en PostgreSQL** con tablas: users, addresses, orders
- ✅ **Soporte humano** - Los usuarios pueden solicitar hablar con un agente
- ✅ Manejo robusto de errores con retry logic
- ✅ Health checks mejorados con verificación de DB
- ✅ Ready para deploy en Railway

## 🏗️ Estructura del Proyecto

```
whatsapp-restaurant-bot/
├── server.js              # Servidor Express + webhooks + health checks
├── start-production.js    # Script de inicio con auto-setup para Railway
├── bot.js                 # Lógica del bot + soporte humano
├── userSessions.js        # Gestión de sesiones en memoria
├── restaurants.js         # Data mock de restaurantes y menús
├── orders.js              # Persistencia PostgreSQL (users, addresses, orders)
├── database.js            # Pool de conexiones PostgreSQL
├── utils.js               # Funciones auxiliares WhatsApp API
├── schema.sql             # Schema de base de datos
├── setup-db.js            # Script para setup inicial de DB (manual)
├── migrate.js             # Script para migrar orders.json a PostgreSQL
├── railway.json           # Configuración para Railway deploy (auto-setup)
├── .env.example           # Template de variables de entorno
├── .gitignore            # Archivos a ignorar
├── package.json          # Dependencias del proyecto
├── orders.json           # [Legacy] Órdenes antiguas (migrar con npm run migrate)
└── README.md             # Este archivo
```

## 📦 Tecnologías

- **Node.js** v14 o superior
- **Express** - Servidor web
- **Axios** - Cliente HTTP para WhatsApp API
- **PostgreSQL** - Base de datos (v12+)
- **pg** - Driver de PostgreSQL para Node.js
- **WhatsApp Business Cloud API** - Mensajería

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd whatsapp-restaurant-bot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
WHATSAPP_TOKEN=tu_access_token_de_meta
WHATSAPP_PHONE_ID=tu_phone_number_id
VERIFY_TOKEN=mi_token_secreto_123
PORT=3000
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_bot
```

### 4. Configurar PostgreSQL

**Opción A: PostgreSQL Local**

Instala PostgreSQL en tu máquina:

```bash
# macOS con Homebrew
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql

# Crear base de datos
createdb whatsapp_bot
```

**Opción B: PostgreSQL en la nube (Railway, Supabase, etc.)**

Si usas Railway o servicios similares, solo necesitas la `DATABASE_URL` que te proveen.

### 5. Inicializar la base de datos

```bash
# Crear las tablas (users, addresses, orders)
npm run db:setup

# Si tienes órdenes en orders.json, migrarlas
npm run migrate
```

El comando `db:setup` creará:
- Tabla `users` - Información de clientes
- Tabla `addresses` - Direcciones de entrega
- Tabla `orders` - Órdenes completas con items
- Funciones SQL para estadísticas
- Triggers para auto-actualización

## 🔑 Obtener Credenciales de WhatsApp Business API

### Paso 1: Crear App en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Inicia sesión con tu cuenta de Facebook
3. Crea una nueva app de tipo "Business"
4. Agrega el producto "WhatsApp" a tu app

### Paso 2: Obtener credenciales

**WHATSAPP_TOKEN:**
- En el panel de WhatsApp > Getting Started
- Copia el "Temporary Access Token" (válido 24hrs)
- Para producción, genera un token permanente

**WHATSAPP_PHONE_ID:**
- En el panel de WhatsApp > Getting Started
- Encuentra el "Phone Number ID" debajo del número de prueba
- Copia ese ID (no el número de teléfono, sino el ID numérico)

**VERIFY_TOKEN:**
- Crea uno personalizado (cualquier string seguro)
- Ejemplo: `mi_bot_secreto_xyz123`
- Lo usarás al configurar el webhook

## 🌐 Configurar Webhook con ngrok

### Paso 1: Instalar ngrok

Descarga ngrok desde [ngrok.com](https://ngrok.com/) o instálalo con:

```bash
# macOS
brew install ngrok

# Linux
snap install ngrok
```

### Paso 2: Exponer tu servidor local

```bash
# Inicia tu servidor
npm start

# En otra terminal, inicia ngrok
ngrok http 3000
```

Ngrok te dará una URL pública como:
```
https://abcd-123-456.ngrok-free.app
```

### Paso 3: Configurar webhook en Meta

1. Ve a tu app en Meta for Developers
2. WhatsApp > Configuration > Webhook
3. Click en "Edit"
4. **Callback URL:** `https://tu-url-de-ngrok.ngrok-free.app/webhook`
5. **Verify Token:** El mismo que pusiste en `.env` (ejemplo: `mi_bot_secreto_xyz123`)
6. Click en "Verify and Save"

### Paso 4: Suscribirse a eventos

En la misma sección de Webhook:
1. Click en "Manage"
2. Suscríbete a estos campos:
   - ✅ `messages`
   - ✅ `message_echoes` (opcional)

¡Listo! Tu webhook está configurado.

## ▶️ Ejecutar el Proyecto

### Modo desarrollo (con reinicio automático)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

El servidor iniciará en `http://localhost:3000`

## 📱 Testing del Bot

### 1. Configurar número de prueba

Meta te proporciona un número de WhatsApp de prueba. Debes agregar tu número personal a la lista de números permitidos:

1. Ve a WhatsApp > API Setup
2. En "To" agrega tu número personal (con código de país)
3. Click en "Send to" - recibirás un código en WhatsApp
4. Ingresa el código para verificar

### 2. Flujo completo de testing

Envía un mensaje al número de WhatsApp Business que configuraste:

**Paso 1:** Envía "Hola"
- El bot te saludará y pedirá tu nombre

**Paso 2:** Responde con tu nombre
- Ejemplo: "Juan Pérez"

**Paso 3:** Selecciona un restaurante
- El bot mostrará lista interactiva de 5 restaurantes
- Click en "Ver Restaurantes" y selecciona uno

**Paso 4:** Selecciona platillos
- El bot mostrará el menú del restaurante
- Selecciona platillos para agregar al carrito
- Puedes agregar múltiples items

**Paso 5:** Finalizar pedido
- Click en "✅ Finalizar pedido"

**Paso 6:** Cliente frecuente
- El bot preguntará si eres cliente frecuente
- Responde "Sí" o "No"

**Paso 7:** Dirección
- Si eres nuevo, escribe tu dirección completa
- Si eres frecuente y tienes dirección guardada, elige usarla o ingresar nueva

**Paso 8:** Zona de entrega
- Selecciona tu zona (1, 2 o 3) usando los botones

**Paso 9:** Confirmar orden
- El bot mostrará un resumen completo
- Click en "✅ Sí, confirmar"

**Paso 10:** ¡Orden creada!
- El bot confirmará tu orden con un ID
- La orden se guardará en `orders.json`

### 3. Probar keywords especiales

Durante el flujo, prueba estos comandos:

- **MENU** - Volver a lista de restaurantes
- **CARRITO** - Ver carrito actual
- **CANCELAR** - Cancelar orden y limpiar sesión
- **HUMANO** - Solicitar soporte de un agente humano
- **AYUDA** - Ver comandos disponibles

## 📊 Verificar Órdenes

Las órdenes se guardan en **PostgreSQL**. Puedes consultarlas de varias formas:

### Usando Node.js REPL

```bash
node
> const { getOrdersByPhone, getOrderStats } = require('./orders')
> getOrdersByPhone('5215512345678').then(console.log)
> getOrderStats().then(console.log)
```

### Usando psql (PostgreSQL CLI)

```bash
# Conectarse a la base de datos
psql $DATABASE_URL

# Ver todas las órdenes
SELECT order_number, user_name, restaurant_name, total, status
FROM orders
ORDER BY created_at DESC;

# Ver órdenes de un usuario
SELECT * FROM orders WHERE phone = '5215512345678';

# Ver estadísticas
SELECT * FROM get_order_stats();

# Ver órdenes que necesitan soporte humano
SELECT order_number, user_name, status, human_support_reason
FROM orders
WHERE needs_human_support = true;
```

### Endpoint de Health Check

Visita `http://localhost:3000/health` para ver:
- Estado de la base de datos
- Pool de conexiones
- Sesiones activas
- Memoria y uptime

## 🏪 Restaurantes Disponibles

1. **🌮 La Taquería del Barrio** - Tacos auténticos (6 platillos)
2. **🍲 Antojitos Doña Lupita** - Comida casera mexicana (7 platillos)
3. **🌊 Mariscos El Pescador** - Mariscos frescos (6 platillos)
4. **🔥 Tortas y Burgers La Lupita** - Tortas y hamburguesas (6 platillos)
5. **🍕 Pizzería Don Romano** - Pizzas artesanales (7 platillos)

## 📍 Zonas de Delivery

- **Zona 1** - Centro: $50 MXN
- **Zona 2** - Colonias cercanas: $80 MXN
- **Zona 3** - Colonias lejanas: $120 MXN

## 🔒 Estados de Sesión

El bot maneja estos estados durante la conversación:

- `initial` - Estado inicial
- `waiting_name` - Esperando nombre del usuario
- `waiting_restaurant` - Esperando selección de restaurante
- `browsing_menu` - Navegando el menú
- `asking_frequent` - Preguntando si es cliente frecuente
- `waiting_address` - Esperando dirección de entrega
- `choosing_zone` - Seleccionando zona de delivery
- `confirming_order` - Confirmando la orden

## 🐛 Debugging y Logs

El servidor imprime logs detallados:

```bash
✅ Nueva sesión creada para usuario: 5215512345678
📨 Mensaje de 5215512345678: Hola
🔄 Sesión actualizada para 5215512345678: { step: 'waiting_name' }
✅ Mensaje enviado a 5215512345678
```

## ⚠️ Troubleshooting

### Error: "Webhook verification failed"
- Verifica que el `VERIFY_TOKEN` en `.env` coincida con el configurado en Meta
- Asegúrate que ngrok esté corriendo y la URL sea correcta

### Error: "Invalid token"
- Verifica tu `WHATSAPP_TOKEN` en `.env`
- El token temporal expira en 24hrs, genera uno permanente para producción

### Error: "Phone number not allowed"
- Agrega tu número a la lista de números permitidos en Meta Dashboard
- Verifica el código que te envían por WhatsApp

### Bot no responde
- Verifica que el servidor esté corriendo (`npm start`)
- Verifica que ngrok esté activo
- Revisa los logs del servidor para ver si llegan los webhooks
- Verifica que estés suscrito a los eventos `messages` en Meta

### Error al guardar orden
- Verifica permisos de escritura en el directorio
- El archivo `orders.json` se crea automáticamente

## 🚂 Deploy en Railway (100% Automático)

Railway es una plataforma cloud que simplifica el deployment de aplicaciones con PostgreSQL incluido. **La base de datos se inicializa automáticamente** al hacer deploy - no necesitas acceso a terminal.

### Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Crea un nuevo proyecto

### Paso 2: Agregar PostgreSQL

1. En tu proyecto Railway, click en "New" → "Database" → "PostgreSQL"
2. Railway creará automáticamente la variable `DATABASE_URL`

### Paso 3: Deploy del bot

**Opción A: Desde GitHub (Recomendado)**

1. Sube tu código a GitHub
2. En Railway, click "New" → "GitHub Repo"
3. Selecciona tu repositorio
4. Railway detectará automáticamente `railway.json` y `package.json`

**Opción B: Railway CLI**

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up
```

### Paso 4: Configurar variables de entorno

En Railway Dashboard, ve a Variables y agrega:

```
WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_ID=your_phone_id
VERIFY_TOKEN=your_verify_token
NODE_ENV=production
```

**Nota:**
- No agregues `DATABASE_URL`, Railway lo provee automáticamente
- No necesitas `SKIP_CONFIRMATION` - la inicialización es 100% automática

### Paso 5: Deploy automático ✨

¡Eso es todo! Railway automáticamente:
1. ✅ Instala las dependencias
2. ✅ Verifica la conexión a PostgreSQL
3. ✅ Detecta si las tablas existen
4. ✅ Crea las tablas automáticamente si no existen
5. ✅ Inicia el servidor

**No necesitas acceso a terminal** - todo se configura automáticamente en el primer deploy.

### Paso 6: Configurar webhook de WhatsApp

1. Railway te dará una URL pública: `https://tu-app.up.railway.app`
2. En Meta for Developers, configura el webhook:
   - Callback URL: `https://tu-app.up.railway.app/webhook`
   - Verify Token: El mismo que pusiste en variables de entorno

### Verificar deployment

Visita `https://tu-app.up.railway.app/health` para verificar:
- ✅ Estado del servidor
- ✅ Conexión a PostgreSQL (debe mostrar "connected: true")
- ✅ Pool de conexiones
- ✅ Memoria y uptime

Si la base de datos está inicializada correctamente, verás `"database": { "connected": true }` en el health check.

### Migración de datos existentes (Opcional)

Si tienes un `orders.json` con datos previos y quieres migrarlos:

1. Opción A - Localmente antes del deploy:
```bash
# Con DATABASE_URL de Railway en tu .env local
npm run migrate
```

2. Opción B - Después del deploy:
   - Conecta tu Railway database localmente
   - Ejecuta `npm run migrate`

**Nota:** La migración no es necesaria para nuevas instalaciones - el bot empezará a guardar órdenes automáticamente en PostgreSQL.

## 📈 Próximas Fases

- [x] Base de datos PostgreSQL
- [x] Soporte humano
- [x] Deploy en Railway
- [ ] Integración con pasarela de pagos (Stripe/Mercado Pago)
- [ ] Redis para sesiones distribuidas
- [ ] Panel administrativo para restaurantes
- [ ] Notificaciones a restaurantes vía email/Slack
- [ ] Sistema de autenticación para dashboard
- [ ] Métricas y analytics
- [ ] Multi-idioma

## 🔐 Seguridad

⚠️ **IMPORTANTE para Producción:**

1. **NUNCA** commitas el archivo `.env` al repositorio
2. Genera un token de acceso permanente (no uses el temporal)
3. Implementa rate limiting
4. Valida todos los inputs del usuario
5. Usa HTTPS en producción (no ngrok)
6. Implementa autenticación para endpoints admin
7. Encripta datos sensibles

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del servidor
2. Verifica la configuración del webhook en Meta
3. Asegúrate que todas las variables de entorno estén configuradas
4. Prueba el endpoint `/health` para verificar que el servidor funciona

## 📄 Licencia

Este proyecto es un MVP de demostración. Úsalo libremente para aprendizaje y desarrollo.

---

**Desarrollado con ❤️ para ChefAtHome**

¡Listo para testing en 2 días! 🚀🇲🇽
