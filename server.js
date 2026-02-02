const express = require(‘express’);
const WebSocket = require(‘ws’);
const { StreamrClient } = require(’@streamr/sdk’);
const path = require(‘path’);

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(‘public’));

// Create HTTP server
const server = app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// State management
let streamrClient = null;
let streamSubscription = null;
let connectedClients = new Set();
let messageBuffer = []; // Store last 100 messages in memory
const MAX_BUFFER_SIZE = 100;
let disconnectTimer = null;
const STREAM_ID = ‘0x567853282663b601bfdb9203819b1fbb3fe18926/m3tering/test’;
const DISCONNECT_DELAY = 60 * 60 * 1000; // 1 hour in milliseconds

// Initialize Streamr client
async function initStreamrClient() {
if (!streamrClient) {
console.log(‘Initializing Streamr client…’);
streamrClient = new StreamrClient({
// Using anonymous subscription (no authentication needed for public streams)
});
}
return streamrClient;
}

// Subscribe to Streamr stream
async function subscribeToStream() {
if (streamSubscription) {
console.log(‘Already subscribed to stream’);
return;
}

try {
const client = await initStreamrClient();
console.log(`Subscribing to stream: ${STREAM_ID}`);

```
streamSubscription = await client.subscribe(STREAM_ID, (message) => {
  console.log('Received message from Streamr:', message);
  
  // Add to buffer
  messageBuffer.push({
    timestamp: Date.now(),
    data: message
  });
  
  // Keep buffer size limited
  if (messageBuffer.length > MAX_BUFFER_SIZE) {
    messageBuffer.shift();
  }
  
  // Broadcast to all connected clients
  broadcastToClients({
    type: 'message',
    data: message,
    timestamp: Date.now()
  });
});

console.log('Successfully subscribed to Streamr stream');
```

} catch (error) {
console.error(‘Error subscribing to stream:’, error);
throw error;
}
}

// Unsubscribe from Streamr stream
async function unsubscribeFromStream() {
if (streamSubscription) {
console.log(‘Unsubscribing from stream…’);
await streamSubscription.unsubscribe();
streamSubscription = null;
console.log(‘Unsubscribed from stream’);
}
}

// Schedule stream disconnection
function scheduleDisconnect() {
// Clear any existing timer
if (disconnectTimer) {
clearTimeout(disconnectTimer);
}

// Only schedule if no clients connected
if (connectedClients.size === 0) {
console.log(‘No clients connected. Will disconnect from stream in 1 hour if no one connects…’);
disconnectTimer = setTimeout(async () => {
if (connectedClients.size === 0) {
console.log(‘1 hour passed with no connections. Disconnecting from stream…’);
await unsubscribeFromStream();
}
}, DISCONNECT_DELAY);
}
}

// Cancel scheduled disconnection
function cancelDisconnect() {
if (disconnectTimer) {
clearTimeout(disconnectTimer);
disconnectTimer = null;
console.log(‘Cancelled scheduled disconnect’);
}
}

// Broadcast message to all connected WebSocket clients
function broadcastToClients(data) {
const message = JSON.stringify(data);
connectedClients.forEach((client) => {
if (client.readyState === WebSocket.OPEN) {
client.send(message);
}
});
}

// Handle WebSocket connections
wss.on(‘connection’, async (ws) => {
console.log(‘New WebSocket client connected’);
connectedClients.add(ws);

// Cancel any scheduled disconnection
cancelDisconnect();

// Subscribe to stream if not already subscribed
if (!streamSubscription) {
try {
await subscribeToStream();
} catch (error) {
ws.send(JSON.stringify({
type: ‘error’,
message: ‘Failed to subscribe to Streamr stream’
}));
}
}

// Send buffered messages to new client
if (messageBuffer.length > 0) {
ws.send(JSON.stringify({
type: ‘history’,
data: messageBuffer
}));
}

// Send connection confirmation
ws.send(JSON.stringify({
type: ‘connected’,
message: ‘Connected to Streamr stream’,
streamId: STREAM_ID
}));

// Handle client messages (if needed)
ws.on(‘message’, (message) => {
console.log(‘Received from client:’, message.toString());
});

// Handle client disconnection
ws.on(‘close’, () => {
console.log(‘WebSocket client disconnected’);
connectedClients.delete(ws);

```
// If no clients left, schedule disconnection
if (connectedClients.size === 0) {
  scheduleDisconnect();
}
```

});

// Handle errors
ws.on(‘error’, (error) => {
console.error(‘WebSocket error:’, error);
connectedClients.delete(ws);
});
});

// Graceful shutdown
process.on(‘SIGINT’, async () => {
console.log(’\nShutting down gracefully…’);

// Close all WebSocket connections
connectedClients.forEach((client) => {
client.close();
});

// Unsubscribe from stream
await unsubscribeFromStream();

// Close server
server.close(() => {
console.log(‘Server closed’);
process.exit(0);
});
});

console.log(`WebSocket server ready. Clients can connect via ws://localhost:${PORT}`);
