// backend/src/config/env.js
// Updated to use Groq API
 
require("dotenv").config();
 
module.exports = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 5000,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
};
 