import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

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
  logging: (sql) => {
    console.log(`[Database] ${sql}`);
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
const MAX_RETRIES = 3;
let connectionAttempts = 0;

const connectDB = async () => {
  while (connectionAttempts < MAX_RETRIES) {
    try {
      await sequelize.authenticate();
      console.log('DB 연결 성공');
      await sequelize.sync({ 
        force: process.env.NODE_ENV === 'development',
        match: new RegExp(process.env.DB_NAME!) 
      });
      return;
    } catch (error) {
      console.error(`연결 실패 (시도 ${connectionAttempts + 1}/${MAX_RETRIES}):`, error);
      connectionAttempts++;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
  throw new Error('DB 연결 최종 실패');
};

connectDB();

export default sequelize;