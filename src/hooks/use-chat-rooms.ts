import { useQuery } from '@tanstack/react-query'
import { chatService, type ChatRoom } from '@/lib/microservices'

// Extended ChatRoom type for local use
export interface LocalChatRoom extends ChatRoom {
    name: string
    isActive: boolean
}

// Transform ChatRoom to LocalChatRoom
const transformRoom = (room: ChatRoom): LocalChatRoom => ({
    ...room,
    name: room.roomId
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    isActive: room.messageCount > 0,
})

// Fallback rooms when API fails or returns empty
const getFallbackRooms = (): LocalChatRoom[] => [
    {
        roomId: 'general',
        name: 'General Chat',
        messageCount: 0,
        userCount: 0,
        isActive: false,
    },
    {
        roomId: 'support',
        name: 'Support',
        messageCount: 0,
        userCount: 0,
        isActive: false,
    },
]

export const useChatRooms = () => {
    return useQuery({
        queryKey: ['chat-rooms'],
        queryFn: async (): Promise<LocalChatRoom[]> => {
            try {
                console.log('Fetching rooms with useQuery...')
                const rooms = await chatService.getAllRooms()
                console.log('Rooms fetched:', rooms)

                if (rooms.length === 0) {
                    console.log('No rooms found, using fallback data')
                    return getFallbackRooms()
                }

                return rooms.map(transformRoom)
            } catch (error) {
                console.error('Error fetching rooms:', error)
                // Return fallback rooms on error
                return getFallbackRooms()
            }
        },
        staleTime: 5 * 1000, // 5 seconds - more responsive
        refetchInterval: 10 * 1000, // Refetch every 10 seconds - faster updates
        refetchOnWindowFocus: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
}

export const useChatRoomMessages = (roomId: string | null) => {
    return useQuery({
        queryKey: ['chat-room-messages', roomId],
        queryFn: async () => {
            if (!roomId) return []
            const response = await chatService.getRoomMessages(roomId)
            return response.data || []
        },
        enabled: !!roomId,
        staleTime: 2 * 1000, // 2 seconds - very responsive
        refetchInterval: 5 * 1000, // Refetch every 5 seconds - real-time feel
    })
}

export const useChatRoomStats = (roomId: string | null) => {
    return useQuery({
        queryKey: ['chat-room-stats', roomId],
        queryFn: async () => {
            if (!roomId) return null
            const response = await chatService.getRoomStats(roomId)
            return response.data || null
        },
        enabled: !!roomId,
        staleTime: 5 * 1000, // 5 seconds - more responsive
        refetchInterval: 10 * 1000, // Refetch every 10 seconds - faster updates
    })
}

export const useBlockedUsers = (roomId: string | null) => {
    return useQuery({
        queryKey: ['blocked-users', roomId],
        queryFn: async () => {
            if (!roomId) return []
            const response = await chatService.getBlockedUsers(roomId)
            return response.data || []
        },
        enabled: !!roomId,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    })
}
