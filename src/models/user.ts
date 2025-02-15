import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

interface UserAttributes {
  id: number;
  email: string;
  password?: string;
  userId: string;
  snsId?: string;
  provider: 'email' | 'google' | 'kakao' | 'naver' | 'combined';
  profileImg: {
    desktop: string;
    mobile: string;
  };

  stylePreferences: string[];
  accessToken?: string;
  refreshToken?: string;
  isVerified: boolean;
  verificationCode?: string;
  verificationExpires?: Date;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  hasCompletedPreferences: boolean;
  isLocked: boolean;
  failedAttempts?: number;
  deletedAt?: Date | null;
  googleId?: string;
  kakaoId?: string;
  naverId?: string;
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {}

// UserModel 인터페이스 추가
interface UserModel extends Model<UserAttributes>, UserAttributes {}

const User = sequelize.define<UserModel>('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  snsId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    field: 'snsId'
  },
  provider: {
    type: DataTypes.ENUM('email', 'google', 'kakao', 'naver', 'combined'),
    allowNull: false,
    defaultValue: 'email'
  },
  profileImg: {
    type: DataTypes.JSON,
    defaultValue: {
      desktop: '/uploads/user_profile/default/desktop_default.webp',
      mobile: '/uploads/user_profile/default/mobile_default.webp',
    },
    field: 'profileImg'
  },
  stylePreferences: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  accessToken: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.STRING(1000),
    allowNull: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  verificationExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  size: {
    type: DataTypes.ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL'),
    defaultValue: 'M',
  },
  hasCompletedPreferences: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  failedAttempts: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  kakaoId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  naverId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  }
}, {
  tableName: 'users',
  freezeTableName: true,
  timestamps: true,
  paranoid: false,
  hooks: {

  },
  defaultScope: {
    attributes: {
      exclude: ['deletedAt']
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['email'],
      where: { provider: 'email' }
    },
    {
      unique: true,
      fields: ['snsId'],
      where: { provider: { [Op.ne]: 'email'} }
    }
  ]
});

// Sequelize 후크 추가
User.addHook('beforeSave', async (user: UserInstance) => {
  if ((user as any).changed('password')) {
    const salt = await bcrypt.genSalt(10);
    (user as any).password = await bcrypt.hash(user.password, salt);
  }
});

export default User;