const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Access Denied. No token provided.");

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (err) {
        throw new Error("Invalid token.");
    }
};
