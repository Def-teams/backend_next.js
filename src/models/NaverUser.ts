import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

interface NaverUserAttributes {
  id: number;
  email: string;
  userId: string;
  naverId: string;
  profileImg: {
    desktop: string;   // 170x170
    mobile: string;    // 110x110
  };
  stylePreferences: string[];
  accessToken?: string;
  refreshToken?: string;
  isVerified: boolean;
  naverProfile?: {
    nickname: string;
    profile_image: string;
    age: string;
    gender: string;
  };
}

class NaverUser extends Model<NaverUserAttributes> {
  declare id: number;
  declare email: string;
  declare userId: string;
  declare naverId: string;
  declare profileImg: {
    desktop: string;
    mobile: string;
  };
  declare stylePreferences: string[];
  declare accessToken?: string;
  declare refreshToken?: string;
  declare isVerified: boolean;
  declare naverProfile?: {
    nickname: string;
    profile_image: string;
    age: string;
    gender: string;
  };
}

NaverUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    naverId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    profileImg: {
      type: DataTypes.JSON,
      defaultValue: {
        desktop: '../public/uploads/desktop/default.jpg',
        mobile: '../public/uploads/mobile/default.jpg'
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
    },
    naverProfile: {
      type: DataTypes.JSON,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'NaverUser',
    timestamps: true
  }
);

export default NaverUser;