'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'userId', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'userId');
  }
}; 