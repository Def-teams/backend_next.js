module.exports = {
    async up(queryInterface, Sequelize) {
      await queryInterface.changeColumn('users', 'accessToken', {
        type: Sequelize.STRING(1000),
        allowNull: true
      });
      await queryInterface.changeColumn('users', 'refreshToken', {
        type: Sequelize.STRING(1000),
        allowNull: true
      });
    },
    async down(queryInterface, Sequelize) {
      await queryInterface.changeColumn('users', 'accessToken', {
        type: Sequelize.STRING,
        allowNull: true
      });
      await queryInterface.changeColumn('users', 'refreshToken', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  };