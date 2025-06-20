const db = require('../config/connection');
const { ObjectId } = require('mongodb');

module.exports = {
  doAdminLogin: async (adminData) => {
    const admin = await db.get().collection('admin').findOne({ username: adminData.username });

    if (admin && admin.password === adminData.password) {
      return { status: true, admin };
    } else {
      return { status: false };
    }
  }
};
