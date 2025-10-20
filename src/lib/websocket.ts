import { io, Socket } from 'socket.io-client'
import config from '@/config/microservices'

// WebSocket event types
export interface ChatMessageEvent {
    id: number
    roomId: string
    name: string
    email: string
    message: string
    createdAt: string
}

export interface UserJoinedEvent {
    roomId: string
    user: {
        email: string
        name: string
    }
}

export interface UserLeftEvent {
    roomId: string
    user: {
        email: string
        name: string
    }
}

export interface BlockedUserEvent {
    message: string
    reason: string
}

export interface RateLimitedEvent {
    message: string
}

export interface ErrorEvent {
    message: string
    error?: string
}

// WebSocket client configuration
interface WebSocketConfig {
    url: string
    token?: string
    options?: {
        autoConnect?: boolean
        reconnection?: boolean
        reconnectionAttempts?: number
        reconnectionDelay?: number
    }
}

// WebSocket event handlers
export interface WebSocketEventHandlers {
    onMessage?: (message: ChatMessageEvent) => void
    onUserJoined?: (data: UserJoinedEvent) => void
    onUserLeft?: (data: UserLeftEvent) => void
    onUserBlocked?: (data: BlockedUserEvent) => void
    onRateLimited?: (data: RateLimitedEvent) => void
    onError?: (data: ErrorEvent) => void
    onConnect?: () => void
    onDisconnect?: () => void
    onReconnect?: () => void
}

// Generic WebSocket client
class WebSocketClient {
    private socket: Socket | null = null
    private config: WebSocketConfig
    private handlers: WebSocketEventHandlers = {}
    private isConnected = false
    // Removed unused reconnect tracking fields

    constructor(config: WebSocketConfig) {
        this.config = {
            url: config.url,
            token: config.token,
            options: {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                ...config.options,
            },
        }
    }

    // Connect to WebSocket server
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve()
                return
            }

            this.socket = io(this.config.url, {
                auth: {
                    token: this.config.token,
                },
                autoConnect: this.config.options?.autoConnect ?? true,
                reconnection: this.config.options?.reconnection ?? true,
                reconnectionAttempts: this.config.options?.reconnectionAttempts ?? 5,
                reconnectionDelay: this.config.options?.reconnectionDelay ?? 1000,
            })

            // Connection events
            this.socket.on('connect', () => {
                console.log('WebSocket connected')
                this.isConnected = true
                // reset reconnect state if you add tracking in the future
                this.handlers.onConnect?.()
                resolve()
            })

            this.socket.on('disconnect', () => {
                console.log('WebSocket disconnected')
                this.isConnected = false
                this.handlers.onDisconnect?.()
            })

            this.socket.on('reconnect', () => {
                console.log('WebSocket reconnected')
                this.handlers.onReconnect?.()
            })

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error)
                reject(error)
            })

            // Chat events
            this.socket.on('newMessage', (message: ChatMessageEvent) => {
                this.handlers.onMessage?.(message)
            })

            this.socket.on('userJoined', (data: UserJoinedEvent) => {
                this.handlers.onUserJoined?.(data)
            })

            this.socket.on('userLeft', (data: UserLeftEvent) => {
                this.handlers.onUserLeft?.(data)
            })

            this.socket.on('blocked_user', (data: BlockedUserEvent) => {
                this.handlers.onUserBlocked?.(data)
            })

            this.socket.on('rate_limited', (data: RateLimitedEvent) => {
                this.handlers.onRateLimited?.(data)
            })

            this.socket.on('error', (data: ErrorEvent) => {
                this.handlers.onError?.(data)
            })
        })
    }

    // Disconnect from WebSocket server
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
            this.isConnected = false
        }
    }

    // Join a room
    joinRoom(roomId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'))
                return
            }

            this.socket.emit('joinRoom', { roomId }, (response: any) => {
                if (response?.error) {
                    reject(new Error(response.error))
                } else {
                    resolve()
                }
            })
        })
    }

    // Leave a room
    leaveRoom(roomId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'))
                return
            }

            this.socket.emit('leaveRoom', { roomId }, (response: any) => {
                if (response?.error) {
                    reject(new Error(response.error))
                } else {
                    resolve()
                }
            })
        })
    }

    // Send a message
    sendMessage(roomId: string, name: string, email: string, message: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket not connected'))
                return
            }

            // Include roomId to use the parameter and for potential server-side validation
            this.socket.emit('sendMessage', { roomId, name, email, message }, (response: any) => {
                if (response?.error) {
                    reject(new Error(response.error))
                } else {
                    resolve()
                }
            })
        })
    }

    // Set event handlers
    setEventHandlers(handlers: WebSocketEventHandlers): void {
        this.handlers = { ...this.handlers, ...handlers }
    }

    // Update authentication token
    updateToken(token: string): void {
        this.config.token = token
        if (this.socket) {
            this.socket.auth = { token }
        }
    }

    // Get connection status
    getConnectionStatus(): boolean {
        return this.isConnected && this.socket?.connected === true
    }

    // Get socket instance (for advanced usage)
    getSocket(): Socket | null {
        return this.socket
    }
}

// Chat WebSocket client with admin capabilities
class ChatWebSocketClient extends WebSocketClient {
    private adminToken?: string
    private monitoredRooms: Set<string> = new Set()

    constructor(config: WebSocketConfig, adminToken?: string) {
        super(config)
        this.adminToken = adminToken
    }

    // Admin-specific methods
    async connectAsAdmin(): Promise<void> {
        if (this.adminToken) {
            this.updateToken(this.adminToken)
        }
        return this.connect()
    }

    // Monitor multiple rooms
    async monitorRooms(roomIds: string[]): Promise<void> {
        const promises = roomIds.map(roomId => this.joinRoom(roomId))
        await Promise.all(promises)
        roomIds.forEach(roomId => this.monitoredRooms.add(roomId))
    }

    // Stop monitoring rooms
    async stopMonitoringRooms(roomIds: string[]): Promise<void> {
        const promises = roomIds.map(roomId => this.leaveRoom(roomId))
        await Promise.all(promises)
        roomIds.forEach(roomId => this.monitoredRooms.delete(roomId))
    }

    // Send admin message
    async sendAdminMessage(roomId: string, message: string, adminName = 'Admin'): Promise<void> {
        return this.sendMessage(roomId, adminName, 'admin@system', message)
    }

    // Get monitored rooms
    getMonitoredRooms(): string[] {
        return Array.from(this.monitoredRooms)
    }

    // Check if room is being monitored
    isMonitoringRoom(roomId: string): boolean {
        return this.monitoredRooms.has(roomId)
    }
}

// WebSocket registry for managing multiple connections
class WebSocketRegistry {
    private clients: Map<string, WebSocketClient> = new Map()

    register(name: string, client: WebSocketClient): void {
        this.clients.set(name, client)
    }

    get(name: string): WebSocketClient | undefined {
        return this.clients.get(name)
    }

    remove(name: string): boolean {
        const client = this.clients.get(name)
        if (client) {
            client.disconnect()
            return this.clients.delete(name)
        }
        return false
    }

    async connectAll(): Promise<void> {
        const promises = Array.from(this.clients.values()).map(client => client.connect())
        await Promise.all(promises)
    }

    disconnectAll(): void {
        this.clients.forEach(client => client.disconnect())
    }

    getConnectionStatus(): Record<string, boolean> {
        const status: Record<string, boolean> = {}
        this.clients.forEach((client, name) => {
            status[name] = client.getConnectionStatus()
        })
        return status
    }

    // Expose all clients for iteration
    getAll(): WebSocketClient[] {
        return Array.from(this.clients.values())
    }
}

// Create WebSocket registry
const webSocketRegistry = new WebSocketRegistry()

// Chat WebSocket configuration
const chatWebSocketConfig: WebSocketConfig = {
    url: config.websocket.url,
    options: {
        autoConnect: false, // We'll connect manually
        reconnection: true,
        reconnectionAttempts: config.websocket.reconnectAttempts,
        reconnectionDelay: config.websocket.reconnectDelay,
    },
}

// Initialize chat WebSocket client
const chatWebSocket = new ChatWebSocketClient(chatWebSocketConfig)
webSocketRegistry.register('chat', chatWebSocket)

// Export the registry and individual clients
export { webSocketRegistry, chatWebSocket }
export type { WebSocketConfig }

// Utility functions for WebSocket management
export const webSocketUtils = {
    // Set global authentication for all WebSocket clients
    setGlobalAuth(token: string) {
        webSocketRegistry.getConnectionStatus()
        webSocketRegistry.getAll().forEach((client) => {
            if (client instanceof ChatWebSocketClient) {
                client.updateToken(token)
            }
        })
    },

    // Get connection status for all clients
    getConnectionStatus(): Record<string, boolean> {
        return webSocketRegistry.getConnectionStatus()
    },

    // Connect all WebSocket clients
    async connectAll(): Promise<void> {
        await webSocketRegistry.connectAll()
    },

    // Disconnect all WebSocket clients
    disconnectAll(): void {
        webSocketRegistry.disconnectAll()
    },

    // Get client by name
    getClient<T extends WebSocketClient>(name: string): T | undefined {
        return webSocketRegistry.get(name) as T | undefined
    }
}

// Default export
export default webSocketRegistry
