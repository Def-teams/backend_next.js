'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'profileImg', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        desktop: '/uploads/user_profile/default/desktop_default.webp',
        mobile: '/uploads/user_profile/default/mobile_default.webp'
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'profileImg');
  }
}; 