'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
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
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
      refreshToken: {
        type: Sequelize.STRING(1000),
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
      },
      googleId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      kakaoId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      naverId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
}; 