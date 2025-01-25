import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

interface EmailUserAttributes {
  id: number;
  email: string;
  userId: string;
  password: string;
  profileImg: {
    desktop: string;
    mobile: string;
  };
  stylePreferences: string[];
  verificationToken: string | null;  
  verificationExpires: Date | null;  
  isVerified: boolean;
}

class EmailUser extends Model<EmailUserAttributes> {
  declare id: number;
  declare email: string;
  declare userId: string;
  declare password: string;
  declare profileImg: {
    desktop: string;
    mobile: string;
  };
  declare stylePreferences: string[];
  declare verificationToken: string;
  declare verificationExpires: Date;
  declare isVerified: boolean;

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

EmailUser.init(
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
    password: {
      type: DataTypes.STRING,
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
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'EmailUser',
    hooks: {
      beforeSave: async (user: EmailUser) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  }
);

export default EmailUser;