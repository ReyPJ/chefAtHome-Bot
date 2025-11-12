# 🤖 WhatsApp Restaurant Bot - ChefAtHome

Bot conversacional de WhatsApp para 5 restaurantes en México usando **WhatsApp Business Cloud API**.

## 📋 Descripción

MVP funcional de un chatbot que permite a usuarios hacer pedidos completos de comida desde WhatsApp. El bot maneja todo el flujo desde la selección del restaurante hasta la confirmación del pedido, guardando la información en archivos JSON.

## 🚀 Características

- ✅ Conversación natural en español (México)
- ✅ 5 restaurantes con menús completos
- ✅ Gestión de carrito de compras
- ✅ Sistema de sesiones en memoria
- ✅ Detección de clientes frecuentes
- ✅ Cálculo de costos de envío por zonas
- ✅ Mensajes interactivos (listas y botones)
- ✅ Keywords especiales (MENU, CARRITO, CANCELAR, AYUDA)
- ✅ Guardado de órdenes en JSON
- ✅ Manejo robusto de errores

## 🏗️ Estructura del Proyecto

```
whatsapp-restaurant-bot/
├── server.js              # Servidor Express + webhooks
├── bot.js                 # Lógica del bot y flujo conversacional
├── userSessions.js        # Gestión de sesiones en memoria
├── restaurants.js         # Data mock de restaurantes y menús
├── orders.js              # Guardar/leer órdenes en JSON
├── utils.js               # Funciones auxiliares
├── .env.example           # Template de variables de entorno
├── .gitignore            # Archivos a ignorar
├── package.json          # Dependencias del proyecto
├── orders.json           # Órdenes guardadas (se crea automáticamente)
└── README.md             # Este archivo
```

## 📦 Tecnologías

- **Node.js** v14 o superior
- **Express** - Servidor web
- **Axios** - Cliente HTTP para WhatsApp API
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
```

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
- **AYUDA** - Ver comandos disponibles

## 📊 Verificar Órdenes

Las órdenes se guardan en `orders.json`. Puedes verlas con:

```bash
cat orders.json
```

Ejemplo de orden guardada:

```json
{
  "id": "ORD-1234567890",
  "phone": "5215512345678",
  "userName": "Juan Pérez",
  "restaurant": {
    "id": "rest_1",
    "name": "🌮 La Taquería del Barrio"
  },
  "items": [
    {
      "id": "item_1_1",
      "name": "Tacos de Pastor",
      "price": 85,
      "quantity": 2
    }
  ],
  "subtotal": 170,
  "deliveryFee": 50,
  "total": 220,
  "address": "Calle Reforma 123, Col. Centro",
  "deliveryZone": 1,
  "status": "pending_payment",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

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

## 📈 Próximas Fases (NO INCLUIDAS en MVP)

- [ ] Integración con pasarela de pagos (Stripe/Mercado Pago)
- [ ] Base de datos SQL/NoSQL
- [ ] Redis para sesiones distribuidas
- [ ] Panel administrativo para restaurantes
- [ ] Notificaciones a restaurantes
- [ ] Sistema de autenticación
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
