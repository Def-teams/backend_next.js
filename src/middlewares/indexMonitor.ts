import { NextRequest, NextResponse } from 'next/server';
import sequelize from '@/config/database';

export const indexCheckMiddleware = async (_: NextRequest) => {
  try {
    const modelNames = Object.keys(sequelize.models);
    
    for (const modelName of modelNames) {
      const model = sequelize.model(modelName);
      console.log(`Checking indexes for: ${model.name}`);
      
      try {
        const tableName = model.getTableName();
        console.log(`Table name: ${tableName}`);
        
        const indexes = await sequelize.getQueryInterface().showIndex(tableName) as Array<{ name: string }>;
        console.log(`Indexes count: ${indexes.length}`);
        
        if (indexes.length >= 64) {
          return NextResponse.json(
            { error: `인덱스 수 초과 (${model.name})` },
            { status: 429 }
          );
        }
      } catch (modelError) {
        console.error(`Model error [${model.name}]:`, modelError);
        throw modelError;
      }
    }
    return null;
  } catch (error) {
    console.error('Index check failed:', error);
    return NextResponse.json(
      { 
        error: '인덱스 검사 실패',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}; 