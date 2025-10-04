require('dotenv').config();
const http = require('http');
const { Server}=  require('socket.io');
const app = require('./app');
const {connectDB} = require('./config/db');

const registerCollabSocket = require('./sockets/collab');

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ( process.env.CORS_Origin || 'http://localhost:3000' ).split(','),
        credentials: true,
        methods: ["GET", "POST"]
    }
});

registerCollabSocket(io);

connectDB().then(() => {
    server.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
}).catch((err) => {
    console.error('Failed to connect to the database', err);
    process.exit(1);
});

