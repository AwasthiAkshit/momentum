const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

console.log('[DEBUG] Starting backend server...');

// Absolute path setup
const rootDir = __dirname;

// Load environment variables
dotenv.config({ path: path.join(rootDir, '.env') });

const connectDB = require(path.join(rootDir, 'config', 'db'));
const { getAIStatus } = require(path.join(rootDir, 'services', 'aiService'));

const app = express();

// Diagnostic Middleware
app.use((req, res, next) => {
    const originalWriteHead = res.writeHead;
    res.writeHead = function (...args) {
        const status = getAIStatus();
        res.setHeader('X-System-Status', status);
        return originalWriteHead.apply(this, args);
    };
    next();
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Routes with robust error handling
const routes = [
    { path: '/api/auth', file: 'authRoutes' },
    { path: '/api/habits', file: 'habitRoutes' },
    { path: '/api/projects', file: 'projectRoutes' },
    { path: '/api/quick-tasks', file: 'quickTaskRoutes' },
    { path: '/api/analytics', file: 'analyticsRoutes' },
    { path: '/api/journal', file: 'journalRoutes' },
    { path: '/api/ai', file: 'aiRoutes' },
    { path: '/api/goals', file: 'goalRoutes' },
    { path: '/api/smart', file: 'smartRoutes' }
];

routes.forEach(route => {
    try {
        const routeModule = require(path.join(rootDir, 'routes', route.file));
        app.use(route.path, routeModule);
        console.log(`[DEBUG] Route loaded: ${route.path}`);
    } catch (error) {
        console.error(`[ERROR] Failed to load route ${route.file}: ${error.message}`);
        // We continue loading other routes if possible
    }
});

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handler
const fs = require('fs');
app.use((err, req, res, next) => {
    console.error(err.stack);
    fs.appendFileSync(path.join(rootDir, 'debug-error.log'), new Date().toISOString() + ' ' + req.url + '\n' + err.stack + '\n\n');
    res.status(500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

// Start Server
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (error) {
        console.error(`Failed to start server: ${error.message}`);
        process.exit(1);
    }
};

startServer();
