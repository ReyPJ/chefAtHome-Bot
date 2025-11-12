// Gestión de sesiones de usuarios en memoria usando Map
// Cada sesión guarda el estado de la conversación y datos del pedido

const sessions = new Map();
const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutos en milisegundos

// Estructura inicial de una sesión
function createInitialSession() {
  return {
    step: 'initial',
    userName: null,
    restaurant: null,
    cart: [],
    isFrequentCustomer: null,
    savedAddress: null,
    currentAddress: null,
    deliveryZone: null,
    deliveryFee: null,
    humanSupportRequested: false,
    humanSupportContext: null,
    humanSupportRequestedAt: null,
    lastActivity: Date.now()
  };
}

// Obtener sesión de usuario (crea una nueva si no existe)
function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, createInitialSession());
    console.log(`✅ Nueva sesión creada para usuario: ${userId}`);
  } else {
    // Actualizar última actividad
    const session = sessions.get(userId);
    session.lastActivity = Date.now();
  }

  return sessions.get(userId);
}

// Actualizar datos de sesión (merge con datos existentes)
function updateSession(userId, data) {
  const currentSession = getSession(userId);
  const updatedSession = {
    ...currentSession,
    ...data,
    lastActivity: Date.now()
  };

  sessions.set(userId, updatedSession);
  console.log(`🔄 Sesión actualizada para ${userId}:`, data);

  return updatedSession;
}

// Limpiar sesión después de completar orden
function clearSession(userId) {
  if (sessions.has(userId)) {
    sessions.delete(userId);
    console.log(`🗑️  Sesión limpiada para usuario: ${userId}`);
    return true;
  }
  return false;
}

// Verificar si una sesión existe
function hasSession(userId) {
  return sessions.has(userId);
}

// Limpiar sesiones inactivas (ejecutar periódicamente)
function cleanInactiveSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [userId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      sessions.delete(userId);
      cleaned++;
      console.log(`⏰ Sesión expirada y eliminada: ${userId}`);
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 ${cleaned} sesiones inactivas limpiadas`);
  }

  return cleaned;
}

// Obtener estadísticas de sesiones
function getSessionStats() {
  return {
    totalSessions: sessions.size,
    sessions: Array.from(sessions.entries()).map(([userId, session]) => ({
      userId,
      step: session.step,
      hasCart: session.cart.length > 0,
      lastActivity: new Date(session.lastActivity).toISOString()
    }))
  };
}

// Iniciar limpieza automática de sesiones cada 10 minutos
setInterval(() => {
  cleanInactiveSessions();
}, 10 * 60 * 1000);

module.exports = {
  getSession,
  updateSession,
  clearSession,
  hasSession,
  cleanInactiveSessions,
  getSessionStats
};
