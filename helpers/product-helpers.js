/*var db=require('../config/connection')
module.exports={
    addProduct:(product)=>{
        console.log(product,callback);
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(true)

        })

    }
} 
var db = require('../config/connection');
var collection=require('../config/collections')

module.exports = {
  addProduct: (product, callback) => {
    console.log(product); // Now prints product only
    db.get().collection('product').insertOne(product).then((data) => {
      console.log(data);
      callback(data.ops[0]._id); // Now works correctly
    }).catch((err) => {
      console.error("Insert error:", err);
      callback(false); // Call back with false on error
    });
  },getAllProducts:()=>{
    return new Promise(async(resolve,reject)=>{
      let products=await db.get().collection('collection.PRODUCT_COLLECTION').find().toArray()
      resolve(products)
    })
  }
}; */
/*var db = require('../config/connection');
var collection = require('../config/collections');
//var objectId=require('mongodb').ObjectID
const { ObjectId } = require('mongodb');
ObjectId(prodId)

module.exports = {
  addProduct: (product, callback) => {
    console.log(product); // Now prints product only
    db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
      console.log(data);
      callback(data.insertedId); // Use insertedId instead of data.ops[0]._id in newer MongoDB drivers
    }).catch((err) => {
      console.error("Insert error:", err);
      callback(false);
    });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
        resolve(products);
      } catch (err) {
        reject(err);
      }
    });
  },
  deleteProduct: (prodId) => {
  return new Promise((resolve, reject) => {
    console.log(prodId);
    console.log(objectId(prodId));

    db.get().collection(collection.PRODUCT_COLLECTION)
      .deleteOne({ _id: objectId(prodId) })  // use deleteOne (not removeOne)
      .then((response) => {
        resolve(response);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

}; */
const db = require('../config/connection');
const collection = require('../config/collections');
const { ObjectId } = require('mongodb'); // ✅ Correct import

module.exports = {
  addProduct: (product, callback) => {
    db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
      callback(data.insertedId);
    }).catch((err) => {
      console.error("Insert error:", err);
      callback(false);
    });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
        resolve(products);
      } catch (err) {
        reject(err);
      }
    });
  },

  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
      try {
        let objId =new ObjectId(prodId)
 // ✅ This line is safe now

        db.get().collection(collection.PRODUCT_COLLECTION)
          .deleteOne({ _id: objId })
          .then((response) => {
            resolve(response);
          })
          .catch((err) => {
            reject("Delete DB error: " + err);
          });
      } catch (err) {
        reject("Invalid ObjectId: " + err);
      }
    });
  },
  /*getProductDetails:(proId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)}).then((product)=>{
        resolve(product)
      })
    })

  } */
 
 getProductDetails: (proId) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.PRODUCT_COLLECTION)
      .findOne({ _id: new ObjectId(proId) })  // ✅ Correct usage
      .then((product) => {
        resolve(product);
      })
      .catch((err) => {
        reject(err);
      });
  });
},
/* updateproduct:(proId,proDetails)=>{
  return new Promise((resolve,reject)=>{
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(proId)},{
      $set:{
        Name:proDetails.Name,
        Description:proDetails.Description,
        Price:proDetails.Price,
        Category:proDetails.Category
      }
    }).then((response)=>{
      resolve()
    })
  })
} */
updateProduct: (proId, proDetails) => {
  return new Promise((resolve, reject) => {
    db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
      { _id: new ObjectId(proId) },
      {
        $set: {
          Name: proDetails.Name,
          Description: proDetails.Description,
          Price: proDetails.Price,
          Category: proDetails.Category
        }
      }
    ).then((response) => {
      resolve(response);
    }).catch((err) => {
      reject(err);
    });
  });
}


};


