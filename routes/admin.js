
var express = require('express');
var router = express.Router();
const db = require('../config/connection');

const verifyAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/login'); // redirect to login if not admin
  }
};

var productHelper = require('../helpers/product-helpers');

// View all products
/*router.get('/', (req, res) => {
  productHelper.getAllProducts().then((products) => {
    console.log(products);
    res.render('admin/view-products', { admin: true, products });
  });
}); */
router.get('/', verifyAdmin, (req, res) => {
  productHelper.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, products });
  });
});

// Render add-product form
router.get('/add-product', verifyAdmin, (req, res) => {
  res.render('admin/add-product');
});

// Add a product
router.post('/add-product', verifyAdmin, (req, res) => {
  console.log(req.body);

  if (req.files && req.files.Image) {
    console.log(req.files.Image);

    productHelper.addProduct(req.body, (id) => {
      let image = req.files.Image;
      image.mv('./public/product-images/' + id + '.jpg', (err) => {
        if (!err) {
          res.render("admin/add-product");
        } else {
          console.error("Image upload error:", err);
          res.status(500).send("Image upload failed");
        }
      });
    });
  } else {
    console.log("No image uploaded or req.files is null");
    res.status(400).send("No image uploaded");
  }
});

// Delete product
router.get('/delete-product', verifyAdmin,(req, res) => {
  let prodId = req.query.id;
  console.log("Deleting ID:", prodId);

  productHelper.deleteProduct(prodId).then(() => {
    res.redirect('/admin');
  }).catch((err) => {
    console.error("Delete error:", err);
    res.status(500).send("Failed to delete product");
  });
});

// Render edit-product page
router.get('/edit-product/:id', verifyAdmin,async (req, res) => {
  try {
    let product = await productHelper.getProductDetails(req.params.id);
    console.log(product);
    res.render('admin/edit-product', { product });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).send("Failed to fetch product");
  }
});


// Update product
router.post('/edit-product/:id', verifyAdmin,(req, res) => {
  let prodId = req.params.id;

  productHelper.updateProduct(prodId, req.body).then(() => {
    if (req.files && req.files.Image) {
      let image = req.files.Image;
      image.mv('./public/product-images/' + prodId + '.jpg', (err) => {
        if (err) {
          console.error("Image upload error:", err);
          return res.status(500).send("Image upload failed");
        }
        res.redirect('/admin');
      });
    } else {
      res.redirect('/admin'); // No image uploaded, just redirect
    }
  }).catch((err) => {
    console.error("Update error:", err);
    res.status(500).send("Failed to update product");
  });
});
router.get('/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/login');
});
router.get('/all-orders', async (req, res) => {
  try {
    const orders = await db.get().collection('order').aggregate([
      { $sort: { date: -1 } }, // ✅ Latest orders first
      {
        $lookup: {
          from: 'user', // your user collection name
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          address: 1,
          pincode: 1,
          mobile: 1,
          total: 1,
          paymentMethod: 1,
          status: 1,
          date: 1,
          email: '$userDetails.Email' // ✅ user's email instead of userId
        }
      }
    ]).toArray();

    // Format date to short string (optional: server-side)
    orders.forEach(order => {
      order.date = new Date(order.date).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    });

    res.render('admin/view-all-orders', { orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send('Internal Server Error');
  }
});




module.exports = router;

