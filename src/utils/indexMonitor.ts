import sequelize from '@/config/database';
import { QueryTypes } from 'sequelize';

export const scheduleIndexCheck = () => {
  // Chrome API 대신 Node.js 스케줄러 사용
  setInterval(async () => {
    const [result] = await sequelize.query<{ count: number }[]>(`
      SELECT COUNT(DISTINCT INDEX_NAME) as count 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = 'def_project'
      AND TABLE_NAME = 'emailusers'
    `, { type: QueryTypes.SELECT });
    
    if (result?.[0]?.count > 50) {
      console.warn(`인덱스 경고: 현재 인덱스 수 ${result[0].count}/64`);
    }
  }, 60 * 60 * 1000); // 1시간 간격
}; 