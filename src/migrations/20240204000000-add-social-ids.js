module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const columns = await queryInterface.describeTable('Users');
      
      if (!columns.googleId) {
        await queryInterface.addColumn('Users', 'googleId', {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true
        }, { transaction });
      }

      if (!columns.kakaoId) {
        await queryInterface.addColumn('Users', 'kakaoId', {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true
        }, { transaction });
      }

      if (!columns.naverId) {
        await queryInterface.addColumn('Users', 'naverId', {
          type: Sequelize.STRING,
          allowNull: true,
          unique: true
        }, { transaction });
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'googleId');
    await queryInterface.removeColumn('Users', 'kakaoId');
    await queryInterface.removeColumn('Users', 'naverId');
  }
}; 