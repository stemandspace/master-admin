# Chat Microservice Integration

This document describes the integration between the chat microservice backend and the master-admin frontend for admin chat management.

## Overview

The integration provides administrators with comprehensive chat room management capabilities including:
- Real-time monitoring of active chat rooms
- Viewing messages and user activity
- Blocking/unblocking users
- Sending admin messages
- Room statistics and analytics

## Architecture

### Backend (Chat Microservice)
- **Location**: `chat-microservice/`
- **Port**: 3000 (default)
- **Features**:
  - REST API endpoints for chat management
  - WebSocket server for real-time communication
  - User blocking/unblocking functionality
  - Rate limiting and authentication

### Frontend (Master Admin)
- **Location**: `master-admin/`
- **Integration Layer**: Microservice integration library
- **Features**:
  - Admin chat management interface
  - Real-time WebSocket connections
  - User blocking interface
  - Admin messaging capabilities

## Integration Components

### 1. Microservice Integration Library
**File**: `master-admin/src/lib/microservices.ts`

A generic library for integrating with microservices that provides:
- HTTP client with authentication
- Request/response logging
- Error handling
- Service registry for multiple microservices

**Key Features**:
- `MicroserviceClient`: Base client for HTTP communication
- `ChatMicroserviceClient`: Specialized client for chat operations
- `MicroserviceRegistry`: Manages multiple service connections
- Utility functions for global operations

### 2. WebSocket Integration
**File**: `master-admin/src/lib/websocket.ts`

Real-time communication layer that provides:
- WebSocket connection management
- Event handling for chat events
- Reconnection logic
- Admin-specific WebSocket operations

**Key Features**:
- `WebSocketClient`: Base WebSocket client
- `ChatWebSocketClient`: Chat-specific WebSocket operations
- `WebSocketRegistry`: Manages multiple WebSocket connections
- Event handlers for real-time updates

### 3. Admin Chat Manager
**File**: `master-admin/src/features/chats/components/admin-chat-manager.tsx`

The main admin interface component that provides:
- Room selection and monitoring
- Message viewing and sending
- User blocking/unblocking
- Real-time updates via WebSocket

**Key Features**:
- Room list with activity indicators
- Message display with admin highlighting
- User blocking interface
- Admin message sending
- Connection status monitoring

### 4. Configuration
**File**: `master-admin/src/config/microservices.ts`

Centralized configuration for all microservice integrations:
- Service URLs and timeouts
- WebSocket settings
- Admin credentials
- Feature flags

## API Endpoints Used

### Chat Microservice Endpoints

#### Authentication
- `POST /api/auth/token` - Generate JWT token
- `GET /api/auth/verify` - Verify token

#### Room Management
- `GET /api/rooms/:roomId/messages` - Get room messages
- `GET /api/rooms/:roomId/stats` - Get room statistics

#### Message Management
- `POST /api/messages` - Send message (internal)

#### User Blocking
- `POST /api/block` - Block user
- `DELETE /api/block` - Unblock user
- `GET /api/block/:roomId` - Get blocked users

#### Health Check
- `GET /api/health` - Service health status

### WebSocket Events

#### Client Events (Outgoing)
- `joinRoom` - Join a chat room
- `leaveRoom` - Leave a chat room
- `sendMessage` - Send a message

#### Server Events (Incoming)
- `newMessage` - New message received
- `userJoined` - User joined room
- `userLeft` - User left room
- `blocked_user` - User blocked notification
- `rate_limited` - Rate limit exceeded
- `error` - Error occurred

## Usage

### 1. Starting the Services

#### Backend (Chat Microservice)
```bash
cd chat-microservice
npm install
npm run dev
```

#### Frontend (Master Admin)
```bash
cd master-admin
npm install
npm run dev
```

### 2. Accessing Admin Mode

1. Navigate to the Chats section in the admin panel
2. Click the "Admin Mode" button in the header
3. The interface will switch to admin chat management

### 3. Admin Operations

#### Monitoring Rooms
- Select a room from the sidebar to view its activity
- View real-time messages and user activity
- Monitor connection status

#### Managing Users
- Block users by clicking "Block User" and providing email/reason
- Unblock users by clicking the X button next to their name
- View blocked users list for each room

#### Sending Messages
- Type admin messages in the message input
- Admin messages are highlighted and marked with "Admin" badge
- Messages are sent in real-time to all room participants

## Configuration

### Environment Variables

Create a `.env` file in the master-admin directory:

```env
# Chat Microservice Configuration
VITE_CHAT_SERVICE_URL=http://localhost:3000
VITE_CHAT_WEBSOCKET_URL=http://localhost:3000

# Admin Configuration
VITE_ADMIN_EMAIL=admin@system
VITE_ADMIN_NAME=Admin

# API Configuration
VITE_API_TIMEOUT=10000
VITE_WEBSOCKET_RECONNECT_ATTEMPTS=5
VITE_WEBSOCKET_RECONNECT_DELAY=2000
```

### Feature Flags

You can enable/disable features in `master-admin/src/config/microservices.ts`:

```typescript
features: {
  enableAdminMode: true,
  enableRealTimeMonitoring: true,
  enableUserBlocking: true,
  enableAdminMessaging: true,
}
```

## Security Considerations

1. **Authentication**: All admin operations require valid JWT tokens
2. **Authorization**: Admin operations are restricted to authenticated admin users
3. **Rate Limiting**: Built-in rate limiting prevents abuse
4. **Input Validation**: All inputs are validated on both client and server
5. **CORS**: Proper CORS configuration for cross-origin requests

## Error Handling

The integration includes comprehensive error handling:

1. **Connection Errors**: Automatic reconnection for WebSocket connections
2. **API Errors**: Graceful error display with user-friendly messages
3. **Validation Errors**: Input validation with clear error messages
4. **Network Errors**: Retry logic and offline handling

## Future Enhancements

The microservice integration library is designed to be extensible:

1. **Additional Microservices**: Easy to add new microservices using the same pattern
2. **Advanced Monitoring**: Real-time analytics and reporting
3. **Bulk Operations**: Batch user management operations
4. **Audit Logging**: Track all admin actions
5. **Role-Based Access**: Different admin permission levels

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check if chat microservice is running on port 3000
2. **WebSocket Errors**: Verify CORS configuration and network connectivity
3. **Authentication Errors**: Ensure valid JWT tokens are being used
4. **Permission Denied**: Check admin user permissions

### Debug Mode

Enable debug logging by setting:
```typescript
// In microservices.ts
console.log(`[${this.serviceName}] Request:`, config.method?.toUpperCase(), config.url)
```

## Support

For issues or questions regarding the integration:
1. Check the console logs for error messages
2. Verify service connectivity
3. Review configuration settings
4. Check network connectivity between services
