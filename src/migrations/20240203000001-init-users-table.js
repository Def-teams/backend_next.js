'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
      },
      snsId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      provider: {
        type: Sequelize.ENUM('email', 'google', 'kakao', 'naver'),
        allowNull: false,
        defaultValue: 'email'
      },
      profileImg: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {
          desktop: '/uploads/user_profile/default/desktop_default.webp',
          mobile: '/uploads/user_profile/default/mobile_default.webp'
        }
      },
      stylePreferences: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      accessToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      refreshToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      verificationCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      verificationExpires: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      size: {
        type: Sequelize.ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL'),
        defaultValue: 'M',
      },
      hasCompletedPreferences: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      isLocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      failedAttempts: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
      // ... 기타 필드들
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
}; 