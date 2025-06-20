var db = require('../config/connection');
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
async function getCartItems(userId) {
  try {
    const cart = await db.get().collection(collection.CART_COLLECTION).findOne({
      user: new ObjectId(userId)
    });
    return cart ? cart.products : [];
  } catch (err) {
    console.error('Error in getCartItems:', err);
    return [];
  }
}


module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        db.get().collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => resolve(data.insertedId))
          .catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("login success");
            response.user = user;
            response.status = true;
          } else {
            console.log("login failed");
            response.status = false;
          }
          resolve(response);
        });
      } else {
        console.log("login failed");
        resolve({ status: false });
      }
    });
  },

  addToCart: (proId, userId) => {
    let proObj = {
      item: new ObjectId(proId),
      quantity: 1
    };

    return new Promise(async (resolve, reject) => {
      try {
        let userCart = await db.get().collection(collection.CART_COLLECTION)
          .findOne({ user: new ObjectId(userId) });

        if (userCart) {
          let proExist = userCart.products.findIndex(
            product => product.item.toString() === proId
          );

          if (proExist !== -1) {
            await db.get().collection(collection.CART_COLLECTION).updateOne(
              {
                user: new ObjectId(userId),
                'products.item': new ObjectId(proId)
              },
              { $inc: { 'products.$.quantity': 1 } }
            );
            resolve();
          } else {
            await db.get().collection(collection.CART_COLLECTION).updateOne(
              { user: new ObjectId(userId) },
              { $push: { products: proObj } }
            );
            resolve();
          }
        } else {
          let cartObject = {
            user: new ObjectId(userId),
            products: [proObj]
          };
          await db.get().collection(collection.CART_COLLECTION).insertOne(cartObject);
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
          { $match: { user: new ObjectId(userId) } },
          { $unwind: '$products' },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'products.item',
              foreignField: '_id',
              as: 'productDetails'
            }
          },
          { $unwind: '$productDetails' },
          {
            $project: {
              _id: '$productDetails._id',
              Title: '$productDetails.Name',
              Price: '$productDetails.Price',
              Category: '$productDetails.Category',
              Description: '$productDetails.Description',
              quantity: '$products.quantity'
            }
          }
        ]).toArray();

        resolve(cartItems);
      } catch (err) {
        reject(err);
      }
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve) => {
      let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
      resolve(cart ? cart.products.length : 0);
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
          { $match: { user: new ObjectId(userId) } },
          { $unwind: '$products' },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: 'products.item',
              foreignField: '_id',
              as: 'productDetails'
            }
          },
          { $unwind: '$productDetails' },
          {
            $project: {
              quantity: '$products.quantity',
              price: { $convert: { input: '$productDetails.Price', to: 'double', onError: 0 } }
            }
          },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: { $multiply: ['$quantity', '$price'] } }
            }
          }
        ]).toArray();
        resolve(total.length > 0 ? total[0].totalAmount : 0);
      } catch (err) {
        reject(err);
      }
    });
  },

  changeProductQuantity: (details, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = parseInt(details.count);
        let quantity = parseInt(details.quantity);

        if (count == -1 && quantity == 1) {
          await db.get().collection(collection.CART_COLLECTION).updateOne(
            { user: new ObjectId(userId) },
            { $pull: { products: { item: new ObjectId(details.product) } } }
          );
          resolve({ removeProduct: true });
        } else {
          await db.get().collection(collection.CART_COLLECTION).updateOne(
            {
              user: new ObjectId(userId),
              'products.item': new ObjectId(details.product)
            },
            { $inc: { 'products.$.quantity': count } }
          );
          resolve({ removeProduct: false });
        }
      } catch (err) {
        reject(err);
      }
    });
  },

  removeFromCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.CART_COLLECTION).updateOne(
          { user: new ObjectId(userId) },
          { $pull: { products: { item: new ObjectId(proId) } } }
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  },

  

  placeOrder: async (orderData) => {
    let orderObj = {
      userId: new ObjectId(orderData.userId),
      address: orderData.address,
      pincode: orderData.pincode,
      mobile: orderData.mobile,
      total: parseInt(orderData.total), // ✅ SAVE total amount
      paymentMethod: orderData['payment-method'],
      status: orderData['payment-method'] === 'COD' ? 'placed' : 'pending',
      products: await getCartItems(orderData.userId), // your own helper
      date: new Date()
    };
  
    const result = await db.get().collection('order').insertOne(orderObj);
    return result.insertedId;
  },
  getUserOrders: async (userId) => {
    try {
      const orders = await db.get().collection('order')
        .find({ userId: new ObjectId(userId) })
        .sort({ date: -1 }) // newest first
        .toArray();
  
      // ✅ Format the date nicely
      return orders.map(order => {
        order.formattedDate = new Date(order.date).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        return order;
      });
    } catch (err) {
      throw err;
    }
  },
  
  
  
  
  


  clearUserCart: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        await db.get().collection(collection.CART_COLLECTION).deleteOne({ user: new ObjectId(userId) });
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
};
