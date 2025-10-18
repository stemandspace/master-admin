import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import {
  IconMessage,
  IconUsers,
  IconBan,
  IconSend,
  IconRefresh,
  IconEye,
  IconEyeOff,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { chatService, type ChatMessage, type BlockedUser, type RoomStats } from '@/lib/microservices'
import { chatWebSocket, type ChatMessageEvent, type WebSocketEventHandlers } from '@/lib/websocket'
import config from '@/config/microservices'

// Types for admin chat management
interface ChatRoom {
  roomId: string
  name: string
  messageCount: number
  userCount: number
  lastActivity?: string
  isActive: boolean
}

interface AdminChatState {
  rooms: ChatRoom[]
  selectedRoom: string | null
  messages: ChatMessage[]
  blockedUsers: BlockedUser[]
  roomStats: RoomStats | null
  isConnected: boolean
  error: string | null
}

// Main admin chat management component
export function AdminChatManager() {
  const [state, setState] = useState<AdminChatState>({
    rooms: [],
    selectedRoom: null,
    messages: [],
    blockedUsers: [],
    roomStats: null,
    isConnected: false,
    error: null,
  })

  const [newMessage, setNewMessage] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [userToBlock, setUserToBlock] = useState('')

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        // Set up WebSocket event handlers
        const handlers: WebSocketEventHandlers = {
          onConnect: () => {
            setState(prev => ({ ...prev, isConnected: true, error: null }))
          },
          onDisconnect: () => {
            setState(prev => ({ ...prev, isConnected: false }))
          },
          onMessage: (message: ChatMessageEvent) => {
            setState(prev => ({
              ...prev,
              messages: [message, ...prev.messages],
            }))
          },
          onError: (error) => {
            setState(prev => ({ ...prev, error: error.message }))
          },
        }

        chatWebSocket.setEventHandlers(handlers)
        await chatWebSocket.connectAsAdmin()
        
        // Load initial data
        await loadRooms()
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to connect' 
        }))
      }
    }

    initializeConnection()

    return () => {
      chatWebSocket.disconnect()
    }
  }, [])

  // Load rooms (mock implementation - would need backend endpoint)
  const loadRooms = async () => {
    try {
      // In a real implementation, you'd call an admin endpoint
      // For now, we'll simulate with some mock data
      const mockRooms: ChatRoom[] = [
        {
          roomId: 'general',
          name: 'General Chat',
          messageCount: 150,
          userCount: 25,
          lastActivity: new Date().toISOString(),
          isActive: true,
        },
        {
          roomId: 'support',
          name: 'Support',
          messageCount: 89,
          userCount: 12,
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          isActive: true,
        },
        {
          roomId: 'announcements',
          name: 'Announcements',
          messageCount: 45,
          userCount: 8,
          lastActivity: new Date(Date.now() - 600000).toISOString(),
          isActive: false,
        },
      ]

      setState(prev => ({ ...prev, rooms: mockRooms }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load rooms' 
      }))
    }
  }

  // Select room and load its data
  const selectRoom = async (roomId: string) => {
    try {
      setState(prev => ({ ...prev, selectedRoom: roomId }))
      
      // Join the room via WebSocket
      await chatWebSocket.joinRoom(roomId)
      
      // Load room data
      const [messagesResponse, statsResponse, blockedResponse] = await Promise.all([
        chatService.getRoomMessages(roomId, 50, 0),
        chatService.getRoomStats(roomId),
        chatService.getBlockedUsers(roomId),
      ])

      setState(prev => ({
        ...prev,
        messages: messagesResponse.data.reverse(), // Show oldest first
        roomStats: statsResponse.data,
        blockedUsers: blockedResponse.data,
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load room data' 
      }))
    }
  }

  // Send admin message
  const sendMessage = async () => {
    if (!newMessage.trim() || !state.selectedRoom) return

    try {
      await chatService.sendMessage({
        roomId: state.selectedRoom,
        name: config.admin.name,
        email: config.admin.email,
        message: newMessage.trim(),
      })

      setNewMessage('')
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to send message' 
      }))
    }
  }

  // Block user
  const blockUser = async () => {
    if (!userToBlock.trim() || !blockReason.trim() || !state.selectedRoom) return

    try {
      await chatService.blockUser({
        roomId: state.selectedRoom,
        email: userToBlock.trim(),
        reason: blockReason.trim(),
      })

      // Refresh blocked users list
      const blockedResponse = await chatService.getBlockedUsers(state.selectedRoom)
      setState(prev => ({ ...prev, blockedUsers: blockedResponse.data }))

      setShowBlockDialog(false)
      setUserToBlock('')
      setBlockReason('')
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to block user' 
      }))
    }
  }

  // Unblock user
  const unblockUser = async (email: string) => {
    if (!state.selectedRoom) return

    try {
      await chatService.unblockUser({
        roomId: state.selectedRoom,
        email,
      })

      // Refresh blocked users list
      const blockedResponse = await chatService.getBlockedUsers(state.selectedRoom)
      setState(prev => ({ ...prev, blockedUsers: blockedResponse.data }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to unblock user' 
      }))
    }
  }

  // Refresh room data
  const refreshRoomData = useCallback(async () => {
    if (!state.selectedRoom) return

    try {
      const [messagesResponse, statsResponse, blockedResponse] = await Promise.all([
        chatService.getRoomMessages(state.selectedRoom, 50, 0),
        chatService.getRoomStats(state.selectedRoom),
        chatService.getBlockedUsers(state.selectedRoom),
      ])

      setState(prev => ({
        ...prev,
        messages: messagesResponse.data.reverse(),
        roomStats: statsResponse.data,
        blockedUsers: blockedResponse.data,
        error: null,
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to refresh data' 
      }))
    }
  }, [state.selectedRoom])

  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar - Rooms List */}
      <div className="w-80 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconMessage size={20} />
                Chat Rooms
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={loadRooms}
                disabled={!state.isConnected}
              >
                <IconRefresh size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {state.rooms.map((room) => (
                  <div
                    key={room.roomId}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      state.selectedRoom === room.roomId
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    onClick={() => selectRoom(room.roomId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{room.name}</h3>
                        <p className="text-sm opacity-70">{room.roomId}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={room.isActive ? "default" : "secondary"}>
                          {room.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="text-xs mt-1">
                          <div className="flex items-center gap-1">
                            <IconMessage size={12} />
                            {room.messageCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <IconUsers size={12} />
                            {room.userCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                state.isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm">
                {state.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Room Details */}
      <div className="flex-1 flex flex-col gap-4">
        {state.selectedRoom ? (
          <>
            {/* Room Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {state.rooms.find(r => r.roomId === state.selectedRoom)?.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Room ID: {state.selectedRoom}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {state.roomStats && (
                      <div className="text-right text-sm">
                        <div>Messages: {state.roomStats.messageCount}</div>
                        <div>Users: {state.roomStats.userCount}</div>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={refreshRoomData}
                    >
                      <IconRefresh size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Messages */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {state.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "p-3 rounded-lg",
                          message.email === config.admin.email
                            ? "bg-primary/10 border-l-4 border-primary"
                            : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{message.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {message.email}
                            </Badge>
                            {message.email === config.admin.email && (
                              <Badge variant="default" className="text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.createdAt), 'HH:mm')}
                          </span>
                        </div>
                        <p className="mt-1 text-sm">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Send Message */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type admin message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <IconSend size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Blocked Users */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <IconBan size={20} />
                    Blocked Users
                  </CardTitle>
                  <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        Block User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Block User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            placeholder="user@example.com"
                            value={userToBlock}
                            onChange={(e) => setUserToBlock(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="reason">Reason</Label>
                          <Textarea
                            id="reason"
                            placeholder="Reason for blocking..."
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={blockUser} disabled={!userToBlock.trim() || !blockReason.trim()}>
                            Block User
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {state.blockedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <span className="font-medium">{user.email}</span>
                          <p className="text-sm text-muted-foreground">{user.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(user.createdAt), 'MMM d, HH:mm')}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unblockUser(user.email)}
                          >
                            <IconX size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {state.blockedUsers.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No blocked users
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <IconMessage size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Select a Room</h3>
              <p className="text-muted-foreground">
                Choose a chat room from the sidebar to view messages and manage users.
              </p>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {state.error && (
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
