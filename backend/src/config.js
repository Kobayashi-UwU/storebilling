import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  db: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'storebilling',
    user: process.env.PGUSER || 'storeadmin',
    password: process.env.PGPASSWORD || 'storeadminpass'
  }
};
