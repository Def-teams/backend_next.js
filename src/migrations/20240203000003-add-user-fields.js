'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'id', {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: false
    });
    await queryInterface.addColumn('users', 'userId', {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true
    });
    await queryInterface.addColumn('users', 'snsId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
    await queryInterface.addColumn('users', 'provider', {
      type: Sequelize.ENUM('email', 'google', 'kakao', 'naver'),
      allowNull: false,
      defaultValue: 'email'
    });
    // ... 기타 필드들 추가
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'userId');
    await queryInterface.changeColumn('users', 'id', {
      type: Sequelize.INTEGER,
      primaryKey: true
    });
    await queryInterface.removeColumn('users', 'snsId');
    await queryInterface.removeColumn('users', 'provider');
    // ... 기타 필드들 제거
  }
}; 