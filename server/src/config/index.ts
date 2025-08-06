import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdefaultkey'; 
export const DATABASE_URL = process.env.DATABASE_URL;

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not defined. Using a default. Please set it in your .env file for production.');
}
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not defined. Please set it in your .env file.');
  process.exit(1);
}