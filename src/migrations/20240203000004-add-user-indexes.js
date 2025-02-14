'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'unique_email'  // 인덱스 이름 지정 (선택 사항)
    });
    await queryInterface.addIndex('users', ['userId'], {
      unique: true,
      name: 'unique_user_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'users_email');
    await queryInterface.removeIndex('users', 'users_user_id');
    await queryInterface.removeIndex('users', 'users_sns_id');
    }
}; 