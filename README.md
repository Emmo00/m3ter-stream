# M3tering Stream Viewer

A real-time web application that subscribes to a Streamr network stream and displays messages via WebSocket to connected clients.

## Features

- ✅ Real-time message streaming from Streamr network
- ✅ WebSocket-based live updates to browser clients
- ✅ In-memory message buffer (last 100 messages)
- ✅ Auto-reconnection for WebSocket clients
- ✅ Automatic stream disconnection after 1 hour of no clients
- ✅ Beautiful, responsive UI with real-time updates
- ✅ Message history on page refresh
- ✅ Clear messages functionality
- ✅ Auto-scroll toggle

## Stream Information

**Stream ID:** `0x567853282663b601bfdb9203819b1fbb3fe18926/m3tering/test`

This stream publishes M3tering data with messages containing m3ter_id and hexadecimal message data.

## Installation

1. Install Node.js (v16 or higher recommended)
1. Install dependencies:

```bash
npm install
```

This will install:

- `@streamr/sdk` - Streamr client library
- `express` - Web server
- `ws` - WebSocket server

## Usage

1. Start the server:

```bash
npm start
```

1. Open your browser and navigate to:

```
http://localhost:3000
```

1. The application will:
- Connect to the Streamr network
- Subscribe to the M3tering stream
- Display real-time messages as they arrive
- Show message history from the buffer

## Architecture

### Backend (server.js)

The Node.js backend handles:

- **Streamr Connection**: Subscribes to the specified stream using @streamr/sdk
- **Message Buffering**: Stores the last 100 messages in memory
- **WebSocket Server**: Broadcasts messages to all connected clients
- **Connection Management**:
  - Tracks connected clients
  - Subscribes to stream when first client connects
  - Waits 1 hour after last client disconnects before unsubscribing

### Frontend (public/index.html)

The web interface provides:

- **Real-time Display**: Shows messages as they arrive
- **WebSocket Client**: Maintains connection to backend
- **Auto-reconnection**: Reconnects if connection drops
- **Message History**: Displays buffered messages on load/refresh
- **UI Controls**: Clear messages, toggle auto-scroll

## Configuration

You can modify these settings in `server.js`:

```javascript
const PORT = 3000;  // Server port
const MAX_BUFFER_SIZE = 100;  // Number of messages to keep in memory
const DISCONNECT_DELAY = 60 * 60 * 1000;  // 1 hour in milliseconds
const STREAM_ID = '0x567853282663b601bfdb9203819b1fbb3fe18926/m3tering/test';
```

## Message Format

Messages from the stream are expected in this format:

```javascript
[
  {
    m3ter_id: 13,
    message: "0000005600..."
  },
  {
    m3ter_id: 12,
    message: "0000004b00..."
  }
  // ... more messages
]
```

## API Endpoints

### HTTP

- `GET /` - Serves the web interface

### WebSocket

- `ws://localhost:3000` - WebSocket endpoint for real-time updates

## WebSocket Message Types

### From Server to Client

1. **Connected**

```json
{
  "type": "connected",
  "message": "Connected to Streamr stream",
  "streamId": "..."
}
```

1. **History**

```json
{
  "type": "history",
  "data": [
    {
      "timestamp": 1234567890,
      "data": { ... }
    }
  ]
}
```

1. **Message**

```json
{
  "type": "message",
  "data": { ... },
  "timestamp": 1234567890
}
```

1. **Error**

```json
{
  "type": "error",
  "message": "Error description"
}
```

## Graceful Shutdown

The server handles SIGINT (Ctrl+C) gracefully:

1. Closes all WebSocket connections
1. Unsubscribes from Streamr stream
1. Closes HTTP server
1. Exits cleanly

## Troubleshooting

### Server won’t start

- Ensure Node.js is installed: `node --version`
- Install dependencies: `npm install`
- Check if port 3000 is available

### No messages appearing

- Check if the Streamr stream is active
- Verify the stream ID is correct
- Check browser console for errors
- Ensure WebSocket connection is established (check status indicator)

### Connection keeps dropping

- Check your internet connection
- Verify firewall settings allow WebSocket connections
- Check server logs for errors

## Development

To modify the UI, edit `public/index.html`. The page includes:

- HTML structure
- CSS styling (in `<style>` tag)
- JavaScript WebSocket client (in `<script>` tag)

To modify backend logic, edit `server.js`.

## Dependencies

- **@streamr/sdk** (^101.0.0): Official Streamr JavaScript client
- **express** (^4.18.2): Web server framework
- **ws** (^8.14.2): WebSocket library

## License

MIT

## Notes

- The application uses anonymous subscription to the Streamr stream (no authentication required for public streams)
- Messages are stored in memory only - they are lost on server restart
- The maximum buffer size is 100 messages to prevent memory issues
- Only the most recent messages are displayed in the UI (DOM limited to 100 cards)
