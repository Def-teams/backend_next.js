import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

interface UserAttributes {
  id?: number;
  email?: string;
  password?: string;
  userId: string;
  snsId?: string;
  provider: 'email' | 'google' | 'kakao' | 'naver';
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
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {}

// UserModel 인터페이스 추가
interface UserModel extends Model<UserAttributes>, UserAttributes {}

const User = sequelize.define<UserModel>('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    set(value: string) {
      if (value) {
        const salt = bcrypt.genSaltSync(10);
        this.setDataValue('password', bcrypt.hashSync(value, salt));
      }
    }
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
  },
  provider: {
    type: DataTypes.ENUM('email', 'google', 'kakao', 'naver'),
    allowNull: false,
  },
  profileImg: {
    type: DataTypes.JSON,
    defaultValue: {
      desktop: '/uploads/user_profile/default/desktop_default.webp',
      mobile: '/uploads/user_profile/default/mobile_default.webp',
    },
  },
  stylePreferences: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.STRING,
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
}, {
  tableName: 'users',
  freezeTableName: true,
  timestamps: true,
  paranoid: true,
  hooks: {
    beforeUpdate: (user: Model<UserAttributes>) => {
      if (user.changed('password' as any) && user.getDataValue('password')) {
        const salt = bcrypt.genSaltSync(10);
        user.setDataValue('password', bcrypt.hashSync(user.getDataValue('password')!, salt));
      }
    }
  }
});

export default User;