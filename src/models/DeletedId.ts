import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class DeletedId extends Model {
  declare id: number;
}

DeletedId.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'DeletedId',
    tableName: 'DeletedIds',
  }
); 