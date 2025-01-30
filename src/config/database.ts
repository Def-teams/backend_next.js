import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';


const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: mysql2,
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  logging: (sql) => {
    console.log(`[Database] ${sql}`);
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});


export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySql Connect Succescsful!');
    
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Model Config!');
    }
  } catch (error) {
    console.error('Database not Connect:', error);
    process.exit(1);
  }
};


connectDB();

export default sequelize;