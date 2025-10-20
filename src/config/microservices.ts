// Configuration for microservices integration
export const config = {
  // Chat microservice configuration
  chatService: {
    baseURL: import.meta.env.VITE_CHAT_SERVICE_URL || 'https://chat-microservice.spacetopia.in/',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  },

  // WebSocket configuration
  websocket: {
    url: import.meta.env.VITE_CHAT_WEBSOCKET_URL || 'https://chat-microservice.spacetopia.in/',
    reconnectAttempts: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_ATTEMPTS || '5'),
    reconnectDelay: parseInt(import.meta.env.VITE_WEBSOCKET_RECONNECT_DELAY || '2000'),
  },

  // Admin configuration
  admin: {
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@spacetopia.in',
    name: import.meta.env.VITE_ADMIN_NAME || 'Admin',
  },

  // Feature flags
  features: {
    enableAdminMode: true,
    enableRealTimeMonitoring: true,
    enableUserBlocking: true,
    enableAdminMessaging: true,
  },
}

export default config
