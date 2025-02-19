module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Users');
    
    // JSON 타입 컬럼 추가 전 존재 여부 확인
    if (!tableInfo.profileImg) {
      await queryInterface.addColumn('Users', 'profileImg', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: Sequelize.literal(
          `(CAST('{"desktop":"/default-desktop.webp","mobile":"/default-mobile.webp"}' AS JSON))`
        )
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Users', 'profileImg');
  }
}; 