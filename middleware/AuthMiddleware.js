const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { StatusCodes } = require("http-status-codes")
dotenv.config();

const validateAuthToken = (req, res, next) => {
    
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Access denied. No token provided.' });
    }

    try {
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();  
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid token' });
    }
};

module.exports = validateAuthToken;