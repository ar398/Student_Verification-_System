const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Static Folders
// Serve frontend client
app.use(express.static(path.join(__dirname, '../client')));
// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/institution', require('./routes/institutionRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Fallback to index.html for client-side routing
app.use((req, res) => {
    // If API route not found
    if (req.originalUrl.startsWith('/api')) {
        res.status(404);
        throw new Error('API route not found');
    }
    // Otherwise serve frontend
    res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
});

// Use Custom Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
