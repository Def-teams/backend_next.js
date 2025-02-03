import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import fs from 'fs';

// 모든 모델에 적용할 공통 설정
const dbConfig = {
  define: {
    freezeTableName: true,
    paranoid: false,
    timestamps: true,
    indexes: [], // 모든 모델에서 자동 인덱스 생성 비활성화
  },
  sync: {
    alter: false, // 자동 스키마 변경 비활성화
    force: false
  }
};

const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: mysql2,
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  logging: (sql: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] EXECUTING: ${sql} \n`;
    console.log(logMessage);
    fs.appendFileSync('sequelize.log', logMessage);
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...dbConfig
});

// 연결 재시도 로직 추가
export const connectDB = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      console.log('Database connected successfully');
      return;
    } catch (error) {
      console.error(`Connection failed, retries left: ${retries}`, error);
      retries--;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('Unable to connect to database');
};

connectDB();

export default sequelize;