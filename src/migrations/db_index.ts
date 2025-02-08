import { QueryInterface } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['userId'], { unique: true });
    await queryInterface.addIndex('users', ['snsId']);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeIndex('users', ['email']);
    await queryInterface.removeIndex('users', ['userId']);
    await queryInterface.removeIndex('users', ['snsId']);
  }
}; 