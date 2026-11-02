import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://sweafex:sweafex_secure_pass_2026@localhost:5432/sweafex_db?schema=public',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'sweafex_access_secret_default_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sweafex_refresh_secret_default_key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || 'local',
    uploadDir: path.resolve(__dirname, '../../uploads')
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};
