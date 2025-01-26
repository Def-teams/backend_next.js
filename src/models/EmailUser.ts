import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

interface EmailUserAttributes {
  id: number;
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
}

class EmailUser extends Model<EmailUserAttributes> {
  public id!: number;
  public email!: string;
  public password!: string;
  public userId!: string;
  public verificationCode!: string;
  public verificationExpires!: Date;
  public isVerified!: boolean;
  public profileImg!: {
    desktop: string;
    mobile: string;
  };
  public stylePreferences!: string[];

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
    verificationCode: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    verificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    }
  },
  {
    sequelize,
    modelName: 'EmailUser',
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