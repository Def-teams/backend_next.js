import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

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
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    tableName: 'EmailUsers',
    hooks: {
      beforeCreate: async (user: EmailUser) => {
        const indexCount = await sequelize.query(
          "SELECT COUNT(*) as count FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'Def_project' AND TABLE_NAME = 'EmailUsers'"
        );

        if (indexCount[0].length > 0 && (indexCount[0][0] as { count: number }).count >= 64) {
          throw new Error('인덱스 수가 64개를 초과하여 사용자를 생성할 수 없습니다.');
        }

        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      afterDestroy: async (user) => {
        await sequelize.query(`
          ALTER SEQUENCE "EmailUsers_id_seq" 
          RESTART WITH ${user.id}
        `);
      }
    },
    indexes: [
      { unique: true, fields: ['email'] },
      { unique: true, fields: ['userId'] }
    ]
  }
);

// 삭제된 ID를 추적하는 테이블
class DeletedId extends Model {
  declare id: number;
}

DeletedId.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
}, {
  sequelize,
  modelName: 'DeletedId',
});

// 사용자 생성 시 ID 재사용
async function createUser(userData: UserData) {
  const deletedId = await DeletedId.findOne();
  let newId;

  if (deletedId) {
    newId = deletedId.id;
    await DeletedId.destroy({ where: { id: newId } });
  } else {
    const lastUser = await EmailUser.findOne({ order: [['id', 'DESC']] });
    newId = lastUser ? lastUser.id + 1 : 1;
  }

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