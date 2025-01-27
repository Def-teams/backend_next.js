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
  size?: {
    height: number;
    weight: number;
    top: string;    // S, M, L, XL 등
    bottom: string; // 28, 29, 30 등
    shoe: number;   // 240, 250 등
  };
  hasCompletedPreferences: boolean;
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
  declare size?: {
    height: number;
    weight: number;
    top: string;
    bottom: string;
    shoe: number;
  };
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
      defaultValue: [],
    },
    hasCompletedPreferences: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    size: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'EmailUser',
    tableName: 'EmailUsers',
    hooks: {
      beforeCreate: async (user: EmailUser) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default EmailUser;