import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

interface GoogleUserAttributes {
  id: number;
  email: string;
  userId: string;
  googleId: string;
  profileImg: {
    desktop: string;   // 170x170
    mobile: string;    // 110x110
  };
  stylePreferences: string[];
  accessToken?: string;
  refreshToken?: string;
  isVerified: boolean;
}

class GoogleUser extends Model<GoogleUserAttributes> {
  declare id: number;
  declare email: string;
  declare userId: string;
  declare googleId: string;
  declare profileImg: {
    desktop: string;
    mobile: string;
  };
  declare stylePreferences: string[];
  declare accessToken?: string;
  declare refreshToken?: string;
  declare isVerified: boolean;
}

GoogleUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    userId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    profileImg: {
      type: DataTypes.JSON,
      defaultValue: {
        desktop: '/uploads/desktop/default.jpg',
        mobile: '/uploads/mobile/default.jpg'
      }
    },
    stylePreferences: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'GoogleUser',
    timestamps: true
  }
);

export default GoogleUser;