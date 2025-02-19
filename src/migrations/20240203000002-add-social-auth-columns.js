'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'googleId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'kakaoId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'naverId', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'googleId');
    await queryInterface.removeColumn('users', 'kakaoId');
    await queryInterface.removeColumn('users', 'naverId');
  }
}; 