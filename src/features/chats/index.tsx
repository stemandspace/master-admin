import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  IconMessages,
  IconSearch,
  IconSend,
  IconBan,
  IconRefresh,
  IconAlertCircle,
  IconX,
  IconUsers,
  IconPlus,
} from '@tabler/icons-react'
import config from '@/config/microservices'
import { chatService } from '@/lib/microservices'
import { cn } from '@/lib/utils'
import {
  chatWebSocket,
  type ChatMessageEvent,
  type WebSocketEventHandlers,
} from '@/lib/websocket'
import {
  useChatRooms,
  useChatRoomMessages,
  useChatRoomStats,
  useBlockedUsers,
} from '@/hooks/use-chat-rooms'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

export default function Chats() {
  const [search, setSearch] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [userToBlock, setUserToBlock] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomMessage, setNewRoomMessage] = useState('')

  // Use React Query hooks for data fetching
  const {
    data: rooms = [],
    isLoading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useChatRooms()

  const {
    data: messages = [],
    isLoading: messagesLoading,
    error: messagesError,
  } = useChatRoomMessages(selectedRoom)

  const { data: roomStats } = useChatRoomStats(selectedRoom)

  const {
    data: blockedUsers = [],
    isLoading: blockedUsersLoading,
    refetch: refetchBlockedUsers,
  } = useBlockedUsers(selectedRoom)

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setError(null)

        // Set up WebSocket event handlers
        const handlers: WebSocketEventHandlers = {
          onConnect: () => {
            setError(null)
          },
          onDisconnect: () => {
            // Handle disconnect if needed
          },
          onMessage: (message: ChatMessageEvent) => {
            // Messages are now handled by React Query
            // The WebSocket message will trigger a refetch
            if (selectedRoom === message.roomId) {
              // Optionally refetch messages for the current room
              // This will be handled by the refetchInterval in useQuery
            }
          },
          onError: (error) => {
            setError(error.message)
          },
        }

        chatWebSocket.setEventHandlers(handlers)

        // Try to connect to WebSocket, but don't block room loading if it fails
        try {
          await chatWebSocket.connectAsAdmin()
        } catch (wsError) {
          console.warn(
            'WebSocket connection failed, continuing without real-time updates:',
            wsError
          )
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to connect')
      }
    }

    initializeConnection()

    return () => {
      chatWebSocket.disconnect()
    }
  }, [selectedRoom])

  // Generate random room name
  const generateRandomRoomName = () => {
    const adjectives = [
      'elephant',
      'tiger',
      'dolphin',
      'eagle',
      'butterfly',
      'penguin',
      'koala',
      'panda',
      'lion',
      'whale',
      'falcon',
      'cheetah',
      'octopus',
      'peacock',
      'giraffe',
      'zebra',
      'flamingo',
      'toucan',
      'jaguar',
      'leopard',
      'rhino',
      'hippo',
      'kangaroo',
      'sloth',
    ]
    const activities = [
      'party',
      'meeting',
      'chat',
      'discussion',
      'hangout',
      'gathering',
      'session',
      'conference',
      'workshop',
      'seminar',
      'summit',
      'retreat',
      'festival',
      'celebration',
      'convention',
      'symposium',
      'forum',
      'debate',
      'brainstorm',
      'collaboration',
    ]
    const locations = [
      'room',
      'space',
      'zone',
      'area',
      'hub',
      'center',
      'lounge',
      'chamber',
      'studio',
      'theater',
      'hall',
      'gallery',
      'cafe',
      'library',
      'garden',
      'terrace',
    ]

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)]
    const randomActivity =
      activities[Math.floor(Math.random() * activities.length)]
    const randomLocation =
      locations[Math.floor(Math.random() * locations.length)]
    const randomNumber = Math.floor(Math.random() * 9999) + 1

    return `${randomAdjective}-${randomActivity}-${randomLocation}-${randomNumber}`
  }

  // Initialize random room name when dialog opens
  const openCreateRoomDialog = () => {
    setNewRoomName(generateRandomRoomName())
    setNewRoomMessage('Welcome to our new chat room! 🎉')
    setShowCreateRoomDialog(true)
  }

  // Create new room
  const createNewRoom = async () => {
    if (!newRoomName.trim() || !newRoomMessage.trim()) return

    try {
      // Send the initial message to create the room
      await chatService.sendMessage({
        roomId: newRoomName.trim(),
        name: config.admin.name,
        email: config.admin.email,
        message: newRoomMessage.trim(),
      })

      // Close dialog and reset form
      setShowCreateRoomDialog(false)
      setNewRoomName('')
      setNewRoomMessage('')

      // Refresh rooms list
      refetchRooms()

      // Select the new room
      await selectRoom(newRoomName.trim())
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create room')
    }
  }

  // Select a room and join via WebSocket
  const selectRoom = async (roomId: string) => {
    try {
      setSelectedRoom(roomId)
      setError(null)

      // Join the room via WebSocket
      await chatWebSocket.joinRoom(roomId)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join room')
    }
  }

  // Filtered rooms based on search
  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      room.roomId.toLowerCase().includes(search.trim().toLowerCase())
  )

  // Send admin message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return

    try {
      console.log('Config values:', {
        adminEmail: config.admin.email,
        adminName: config.admin.name,
        adminEmailType: typeof config.admin.email,
        adminEmailLength: config.admin.email?.length,
      })

      const messageData = {
        roomId: selectedRoom,
        name: config.admin.name,
        email: config.admin.email,
        message: newMessage.trim(),
      }

      console.log('Sending message with data:', messageData)
      console.log('Email being sent:', JSON.stringify(messageData.email))

      await chatService.sendMessage(messageData)

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to send message'
      )
    }
  }

  // Block user
  const blockUser = async () => {
    if (!userToBlock.trim() || !blockReason.trim() || !selectedRoom) return

    try {
      await chatService.blockUser({
        roomId: selectedRoom,
        email: userToBlock.trim(),
        reason: blockReason.trim(),
      })

      // Refresh blocked users list
      refetchBlockedUsers()

      setShowBlockDialog(false)
      setUserToBlock('')
      setBlockReason('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to block user')
    }
  }

  // Unblock user
  const unblockUser = async (email: string) => {
    if (!selectedRoom) return

    try {
      await chatService.unblockUser({
        roomId: selectedRoom,
        email,
      })

      // Refresh blocked users list
      refetchBlockedUsers()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to unblock user'
      )
    }
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <IconMessages size={20} className='text-primary' />
            <span className='font-semibold'>Live Chat Management</span>
          </div>
        </div>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex h-full gap-6'>
          {/* Left Sidebar - Rooms List */}
          <div className='gap-4ś flex h-full w-80 flex-col'>
            <Card className='h-full'>
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <CardTitle className='flex items-center gap-2'>
                    <IconMessages size={20} />
                    Chat Rooms
                  </CardTitle>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='default'
                      onClick={openCreateRoomDialog}
                    >
                      <IconPlus size={16} />
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => refetchRooms()}
                      disabled={roomsLoading}
                    >
                      <IconRefresh size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='h-full'>
                <div className='mb-4'>
                  <label className='flex h-10 w-full items-center space-x-0 rounded-md border border-input pl-2 focus-within:outline-none focus-within:ring-1 focus-within:ring-ring'>
                    <IconSearch size={15} className='mr-2 stroke-slate-500' />
                    <span className='sr-only'>Search</span>
                    <input
                      type='text'
                      className='w-full flex-1 bg-inherit text-sm focus-visible:outline-none'
                      placeholder='Search rooms...'
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                </div>
                <ScrollArea className='h-full'>
                  <div className='space-y-2'>
                    {roomsLoading ? (
                      <div className='py-4 text-center'>
                        <div className='mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-primary'></div>
                        <p className='mt-2 text-sm text-muted-foreground'>
                          Loading rooms...
                        </p>
                      </div>
                    ) : filteredRooms.length > 0 ? (
                      filteredRooms.map((room) => (
                        <div
                          key={room.roomId}
                          className={cn(
                            'cursor-pointer rounded-lg border p-2 px-4 transition-colors',
                            selectedRoom === room.roomId
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          )}
                          onClick={() => selectRoom(room.roomId)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <h3 className='line-clamp-1 text-sm font-medium'>
                                {room.name}
                              </h3>
                              <p className='text-xs opacity-70'>
                                {room.roomId}
                              </p>
                            </div>
                            <div className='flex items-center gap-3 text-xs'>
                              <div className='flex items-center gap-1'>
                                <IconMessages size={12} />
                                <span>{room.messageCount}</span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <IconUsers size={12} />
                                <span>{room.userCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='py-4 text-center'>
                        <p className='text-sm text-muted-foreground'>
                          No rooms found
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Room Details */}
          <div className='flex flex-1 flex-col gap-4'>
            {selectedRoom ? (
              <>
                {/* Room Header */}
                <Card>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <div>
                        <CardTitle>
                          {rooms.find((r) => r.roomId === selectedRoom)?.name}
                        </CardTitle>
                        <p className='text-sm text-muted-foreground'>
                          Room ID: {selectedRoom}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        {roomStats && (
                          <div className='text-right text-sm'>
                            <div>Messages: {roomStats.messageCount}</div>
                            <div>Users: {roomStats.userCount}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Messages */}
                <Card className='flex-1'>
                  <CardHeader>
                    <CardTitle>Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-64'>
                      <div className='space-y-2'>
                        {messagesLoading ? (
                          <div className='py-4 text-center'>
                            <div className='mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-primary'></div>
                            <p className='mt-2 text-sm text-muted-foreground'>
                              Loading messages...
                            </p>
                          </div>
                        ) : messages.length > 0 ? (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                'rounded-lg p-3',
                                message.email === config.admin.email
                                  ? 'border-l-4 border-primary bg-primary/10'
                                  : 'bg-muted/50'
                              )}
                            >
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-2'>
                                  <span className='font-medium'>
                                    {message.name}
                                  </span>
                                  <Badge variant='outline' className='text-xs'>
                                    {message.email}
                                  </Badge>
                                  {message.email === config.admin.email && (
                                    <Badge
                                      variant='default'
                                      className='text-xs'
                                    >
                                      Admin
                                    </Badge>
                                  )}
                                </div>
                                <span className='text-xs text-muted-foreground'>
                                  {format(new Date(message.createdAt), 'HH:mm')}
                                </span>
                              </div>
                              <p className='mt-1 text-sm'>{message.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className='py-4 text-center'>
                            <p className='text-sm text-muted-foreground'>
                              No messages yet
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Send Message */}
                <Card>
                  <CardContent className='pt-6'>
                    <div className='flex gap-2'>
                      <Input
                        placeholder='Type admin message...'
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <IconSend size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Blocked Users */}
                <Card>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='flex items-center gap-2'>
                        <IconBan size={20} />
                        Blocked Users
                      </CardTitle>
                      <Dialog
                        open={showBlockDialog}
                        onOpenChange={setShowBlockDialog}
                      >
                        <DialogTrigger asChild>
                          <Button size='sm'>Block User</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Block User</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <div>
                              <Label htmlFor='email'>Email</Label>
                              <Input
                                id='email'
                                placeholder='user@example.com'
                                value={userToBlock}
                                onChange={(e) => setUserToBlock(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor='reason'>Reason</Label>
                              <Textarea
                                id='reason'
                                placeholder='Reason for blocking...'
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                              />
                            </div>
                            <div className='flex justify-end gap-2'>
                              <Button
                                variant='outline'
                                onClick={() => setShowBlockDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={blockUser}
                                disabled={
                                  !userToBlock.trim() || !blockReason.trim()
                                }
                              >
                                Block User
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className='h-32'>
                      <div className='space-y-2'>
                        {blockedUsersLoading ? (
                          <div className='py-4 text-center'>
                            <div className='mx-auto h-4 w-4 animate-spin rounded-full border-b-2 border-primary'></div>
                            <p className='mt-2 text-sm text-muted-foreground'>
                              Loading blocked users...
                            </p>
                          </div>
                        ) : blockedUsers.length > 0 ? (
                          blockedUsers.map((user) => (
                            <div
                              key={user.id}
                              className='flex items-center justify-between rounded border p-2'
                            >
                              <div>
                                <span className='font-medium'>
                                  {user.email}
                                </span>
                                <p className='text-sm text-muted-foreground'>
                                  {user.reason}
                                </p>
                              </div>
                              <div className='flex items-center gap-2'>
                                <span className='text-xs text-muted-foreground'>
                                  {format(
                                    new Date(user.createdAt),
                                    'MMM d, HH:mm'
                                  )}
                                </span>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => unblockUser(user.email)}
                                >
                                  <IconX size={14} />
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className='py-4 text-center text-sm text-muted-foreground'>
                            No blocked users
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className='flex flex-1 items-center justify-center'>
                <div className='text-center'>
                  <IconMessages
                    size={48}
                    className='mx-auto mb-4 text-muted-foreground'
                  />
                  <h3 className='mb-2 text-lg font-medium'>Select a Room</h3>
                  <p className='text-muted-foreground'>
                    Choose a chat room from the sidebar to view messages and
                    manage users.
                  </p>
                </div>
              </Card>
            )}

            {/* Error Display */}
            {(error || roomsError || messagesError) && (
              <Alert variant='destructive'>
                <IconAlertCircle className='h-4 w-4' />
                <AlertDescription>
                  {error || roomsError?.message || messagesError?.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Create Room Dialog */}
            <Dialog
              open={showCreateRoomDialog}
              onOpenChange={setShowCreateRoomDialog}
            >
              <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                  <DialogTitle>Create New Chat Room</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='roomName'>Room Name</Label>
                    <div className='flex gap-2'>
                      <Input
                        id='roomName'
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder='Enter room name...'
                      />
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setNewRoomName(generateRandomRoomName())}
                      >
                        Random
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='roomMessage'>Starting Message</Label>
                    <Textarea
                      id='roomMessage'
                      value={newRoomMessage}
                      onChange={(e) => setNewRoomMessage(e.target.value)}
                      placeholder='Enter your starting message...'
                      rows={3}
                    />
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Button
                      variant='outline'
                      onClick={() => setShowCreateRoomDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createNewRoom}
                      disabled={!newRoomName.trim() || !newRoomMessage.trim()}
                    >
                      Create Room
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Main>
    </>
  )
}
