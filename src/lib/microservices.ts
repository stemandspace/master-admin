import axios, { AxiosInstance, AxiosResponse } from 'axios'
import config from '@/config/microservices'

// Base configuration for microservices
interface MicroserviceConfig {
    baseURL: string
    timeout?: number
    headers?: Record<string, string>
}

// Chat microservice specific types
export interface ChatMessage {
    id: number
    roomId: string
    name: string
    email: string
    message: string
    createdAt: string
}

export interface ChatRoom {
    roomId: string
    messageCount: number
    userCount: number
    lastActivity?: string
}

export interface BlockedUser {
    id: number
    email: string
    reason: string
    createdAt: string
}

export interface RoomStats {
    roomId: string
    messageCount: number
    userCount: number
}

export interface BlockUserRequest {
    roomId: string
    email: string
    reason: string
}

export interface UnblockUserRequest {
    roomId: string
    email: string
}

export interface SendMessageRequest {
    roomId: string
    name: string
    email: string
    message: string
}

// Generic microservice client
class MicroserviceClient {
    private client: AxiosInstance
    private serviceName: string

    constructor(config: MicroserviceConfig, serviceName: string) {
        this.serviceName = serviceName
        this.client = axios.create({
            baseURL: config.baseURL,
            timeout: config.timeout || 10000,
            headers: {
                'Content-Type': 'application/json',
                ...config.headers,
            },
        })

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`[${this.serviceName}] Request:`, config.method?.toUpperCase(), config.url)
                if (config.data) {
                    console.log(`[${this.serviceName}] Request Data:`, config.data)
                }
                return config
            },
            (error) => {
                console.error(`[${this.serviceName}] Request Error:`, error)
                return Promise.reject(error)
            }
        )

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                console.log(`[${this.serviceName}] Response:`, response.status, response.config.url)
                return response
            },
            (error) => {
                console.error(`[${this.serviceName}] Response Error:`, error.response?.status, error.message)
                return Promise.reject(error)
            }
        )
    }

    // Generic methods
    async get<T>(url: string, params?: Record<string, any>): Promise<T> {
        const response: AxiosResponse<T> = await this.client.get(url, { params })
        return response.data
    }

    async post<T>(url: string, data?: any): Promise<T> {
        const response: AxiosResponse<T> = await this.client.post(url, data)
        return response.data
    }

    async put<T>(url: string, data?: any): Promise<T> {
        const response: AxiosResponse<T> = await this.client.put(url, data)
        return response.data
    }

    async delete<T>(url: string, data?: any): Promise<T> {
        const response: AxiosResponse<T> = await this.client.delete(url, data)
        return response.data
    }

    // Set authentication token
    setAuthToken(token: string) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }

    // Remove authentication token
    removeAuthToken() {
        delete this.client.defaults.headers.common['Authorization']
    }
}

// Chat microservice client
class ChatMicroserviceClient extends MicroserviceClient {
    constructor(config: MicroserviceConfig) {
        super(config, 'ChatService')
    }

    // Health check
    async healthCheck() {
        return this.get<{ status: string; timestamp: string; uptime: number }>('/api/health')
    }

    // Authentication
    async generateToken(email: string, name: string) {
        return this.post<{ message: string; token: string }>('/api/auth/token', { email, name })
    }

    async verifyToken() {
        return this.get<{ message: string; user: { email: string; name: string } }>('/api/auth/verify')
    }

    // Room management
    async getRoomMessages(roomId: string, limit = 50, offset = 0) {
        return this.get<{
            message: string
            data: ChatMessage[]
            pagination: { limit: number; offset: number; hasMore: boolean }
        }>(`/api/rooms/${roomId}/messages`, { limit, offset })
    }

    async getRoomStats(roomId: string) {
        return this.get<{ message: string; data: RoomStats }>(`/api/rooms/${roomId}/stats`)
    }

    // Message management
    async sendMessage(messageData: SendMessageRequest) {
        return this.post<{
            message: string
            data: ChatMessage
        }>('/api/messages', messageData)
    }

    // User blocking
    async blockUser(blockData: BlockUserRequest) {
        return this.post<{
            message: string
            data: BlockedUser
        }>('/api/block', blockData)
    }

    async unblockUser(unblockData: UnblockUserRequest) {
        return this.delete<{ message: string }>('/api/block', unblockData)
    }

    async getBlockedUsers(roomId: string) {
        return this.get<{
            message: string
            data: BlockedUser[]
        }>(`/api/block/${roomId}`)
    }

    // Admin specific methods
    async getAllRooms(): Promise<ChatRoom[]> {
        try {
            console.log('Fetching rooms from API...')
            const response = await this.get<{
                message: string
                data: Array<{
                    roomId: string
                    messageCount: number
                    userCount: number
                    lastActivity: string | null
                }>
            }>('/api/rooms')

            console.log('API response:', response)

            // Transform the response to match our ChatRoom interface
            const rooms = response.data.map(room => ({
                roomId: room.roomId,
                name: this.formatRoomName(room.roomId),
                messageCount: room.messageCount,
                userCount: room.userCount,
                lastActivity: room.lastActivity || undefined,
                isActive: room.messageCount > 0, // Consider active if it has messages
            }))

            console.log('Transformed rooms:', rooms)
            return rooms
        } catch (error) {
            console.error('Error fetching all rooms:', error)
            return []
        }
    }

    // Helper method to format room names
    private formatRoomName(roomId: string): string {
        // Convert room ID to a more readable format
        return roomId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    async getActiveUsers(roomId: string): Promise<string[]> {
        // This would need WebSocket connection tracking
        // For now, return empty array
        console.log('Getting active users for room:', roomId)
        return []
    }
}

// Microservice registry
class MicroserviceRegistry {
    private services: Map<string, MicroserviceClient> = new Map()

    register(name: string, client: MicroserviceClient) {
        this.services.set(name, client)
    }

    get(name: string): MicroserviceClient | undefined {
        return this.services.get(name)
    }

    getAll(): Map<string, MicroserviceClient> {
        return this.services
    }

    remove(name: string): boolean {
        return this.services.delete(name)
    }
}

// Create and configure microservices
const microserviceRegistry = new MicroserviceRegistry()

// Chat microservice configuration
const chatServiceConfig: MicroserviceConfig = {
    baseURL: config.chatService.baseURL,
    timeout: config.chatService.timeout,
}

// Initialize chat microservice
const chatService = new ChatMicroserviceClient(chatServiceConfig)
microserviceRegistry.register('chat', chatService)

// Export the registry and individual services
export { microserviceRegistry, chatService }
export type { MicroserviceConfig, MicroserviceClient }

// Utility functions for common operations
export const microserviceUtils = {
    // Set authentication for all services
    setGlobalAuth(token: string) {
        microserviceRegistry.getAll().forEach((service) => {
            service.setAuthToken(token)
        })
    },

    // Remove authentication from all services
    removeGlobalAuth() {
        microserviceRegistry.getAll().forEach((service) => {
            service.removeAuthToken()
        })
    },

    // Health check all services
    async healthCheckAll(): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {}

        for (const [name, service] of microserviceRegistry.getAll()) {
            try {
                await service.get('/api/health')
                results[name] = true
            } catch (error) {
                console.error(`Health check failed for ${name}:`, error)
                results[name] = false
            }
        }

        return results
    },

    // Get service by name with type safety
    getService<T extends MicroserviceClient>(name: string): T | undefined {
        return microserviceRegistry.get(name) as T | undefined
    }
}

// Default export
export default microserviceRegistry
