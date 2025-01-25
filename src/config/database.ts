import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';

// Sequelize 인스턴스 생성
const sequelize = new Sequelize({
  dialect: 'mysql',
  dialectModule: mysql2, // 명시적으로 mysql2 모듈 지정
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

// 데이터베이스 연결 테스트 함수
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL 데이터베이스 연결 성공!');
    
    // 개발 환경에서만 sync 사용
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('모델 동기화 완료!');
    }
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
    process.exit(1); // 심각한 에러 발생 시 프로세스 종료
  }
};

// 초기 연결 시도
connectDB();

export default sequelize;