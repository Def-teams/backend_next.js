import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';
import { QueryTypes } from 'sequelize';

export interface EmailUserAttributes {
  id?: number;
  email: string;
  password: string;
  userId: string;
  verificationCode: string | null;
  verificationExpires: Date | null;
  isVerified: boolean;
  profileImg: {
    desktop: string;
    mobile: string;
  };
  stylePreferences: string[];
  size: 'XS'|'S'|'M'|'L'|'XL'|'XXL';
  hasCompletedPreferences: boolean;
}

// 사용자 데이터 타입 정의
interface UserData {
  email: string;
  password: string;
  userId: string;
  profileImg?: {
    desktop: string;
    mobile: string;
  };
  stylePreferences?: string[];
  isVerified?: boolean;
  size?: 'XS'|'S'|'M'|'L'|'XL'|'XXL';
  hasCompletedPreferences?: boolean;
}

class EmailUser extends Model<EmailUserAttributes> {
  declare id: number;
  declare email: string;
  declare password: string;
  declare userId: string;
  declare verificationCode: string | null;
  declare verificationExpires: Date | null;
  declare isVerified: boolean;
  declare profileImg: {
    desktop: string;
    mobile: string;
  };
  declare stylePreferences: string[];
  declare size: 'XS'|'S'|'M'|'L'|'XL'|'XXL';
  declare hasCompletedPreferences: boolean;

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

EmailUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: 'email_unique_index',
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    verificationCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    profileImg: {
      type: DataTypes.JSON,
      defaultValue: {
        desktop: '/uploads/desktop/default.jpg',
        mobile: '/uploads/mobile/default.jpg',
      },
    },
    stylePreferences: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING,
      validate: {
        isIn: [['XS', 'S', 'M', 'L', 'XL', 'XXL']]
      },
      defaultValue: 'M'
    },
    hasCompletedPreferences: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'EmailUser',
    tableName: 'emailusers',
    paranoid: false,
    hooks: {
      beforeCreate: async (user: EmailUser) => {
        const indexCount = await sequelize.query<[{ count: number }]>(`
          SELECT COUNT(DISTINCT INDEX_NAME) as count 
          FROM information_schema.STATISTICS 
          WHERE TABLE_SCHEMA = 'def_project' 
          AND TABLE_NAME = 'emailusers'
        `, { type: QueryTypes.SELECT });

        if (indexCount?.[0]?.[0]?.count >= 64) {
          throw new Error('인덱스 수가 64개를 초과하여 사용자를 생성할 수 없습니다.');
        }

        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      afterDestroy: async (user) => {
        const isDev = process.env.NODE_ENV === 'development';
        if (!isDev) return; // 프로덕션 환경에서는 ID 재정렬 비활성화

        // 삭제된 ID 처리 로직
        await sequelize.query(`UPDATE emailusers SET id = id - 1 WHERE id > ${user.id}`);
        
        // 시퀀스 재설정
        const maxId = await EmailUser.max('id');
        await sequelize.query(`ALTER SEQUENCE emailusers_id_seq RESTART WITH ${maxId + 1}`);
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['userId']
      }
    ]
  
  }
);

// 사용자 생성 시 ID 재사용
async function createUser(userData: UserData) {
  const lastUser = await EmailUser.findOne({ 
    order: [['id', 'DESC']],
    attributes: ['id']
  });
  
  const newId = lastUser ? lastUser.id + 1 : 1;

  const newUser = await EmailUser.create({
    ...userData,
    id: newId,
    size: userData.size || 'M',
    hasCompletedPreferences: userData.hasCompletedPreferences || false,
    isVerified: userData.isVerified || false,
    stylePreferences: userData.stylePreferences || [],
    profileImg: userData.profileImg || {
      desktop: '/uploads/desktop/default.jpg',
      mobile: '/uploads/mobile/default.jpg'
    }
  });
  return newUser;
}

export default EmailUser;