var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const { ObjectId } = require('mongodb'); // ✅ Add this

const userHelpers=require('../helpers/user-helpers');
const db = require('../config/connection'); // ✅ This gives access to db.get()
const adminHelpers = require('../helpers/admin-helpers');

const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

router.get('/', async function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  let cartCount = null;

  if (user) {
    cartCount = await userHelpers.getCartCount(user._id); // ✅ Remove `let`
  }

  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-products', { products, user, cartCount }); // ✅ cartCount is now correctly passed
  });
});

router.get('/login', (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect('/');
  } else {
    const error = req.session.loginErr;
    req.session.loginErr = false;
    return res.render('user/login', { loginErr: error });
  }
});

router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIn=true
    req.session.user = response;
    res.redirect('/');


  })

})
/*router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loginErr=true
      res.redirect('/login',)
    }
  })
}) */
  router.post('/login', async (req, res) => {
    const { Email, Password, loginType } = req.body;
  
    console.log("🔐 Login attempt:", { Email, Password, loginType });
  
    if (loginType === 'admin') {
      const admin = await db.get().collection('admin').findOne({ username: Email });
  
      if (admin && admin.password === Password) {
        req.session.admin = true;
        return res.redirect('/admin');
      } else {
        req.session.loginErr = 'Invalid admin credentials';
        return res.redirect('/login');
      }
  
    } else {
      userHelpers.doLogin(req.body).then((response) => {
        if (response.status) {
          req.session.loggedIn = true;
          req.session.user = response.user;
          res.redirect('/');
        } else {
          req.session.loginErr = 'Invalid user credentials';
          res.redirect('/login');
        }
      });
    }
  });
  
  
  
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');  // ✅ redirect to login if user not logged in
  }

  try {
    let products = await userHelpers.getCartProducts(req.session.user._id);
    let total = await userHelpers.getTotalAmount(req.session.user._id);

    res.render('user/cart', { products, user: req.session.user, total });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});


router.get('/add-to-cart/:id', async (req, res) => {
  if (!req.session.user) {
    return res.json({ status: false, login: true });
  }

  try {
    await userHelpers.addToCart(req.params.id, req.session.user._id);
    res.json({ status: true }); // ✅ this must reach frontend
  } catch (err) {
    console.error(err);
    res.json({ status: false });
  }
});

router.post('/increment-quantity/:id', async (req, res) => {
  if (!req.session.user) {
    return res.json({ status: false, login: true });
  }

  try {
    await userHelpers.incrementQuantity(req.params.id, req.session.user._id);
    res.json({ status: true });
  } catch (err) {
    console.error('Error incrementing quantity:', err);
    res.json({ status: false });
  }
});

router.post('/decrement-quantity/:id', async (req, res) => {
  if (!req.session.user) {
    return res.json({ status: false, login: true });
  }

  try {
    let result = await userHelpers.decrementQuantity(req.params.id, req.session.user._id);
    res.json({ status: true, removeProduct: result.removeProduct });
  } catch (err) {
    console.error('Error decrementing quantity:', err);
    res.json({ status: false });
  }
});
router.get('/remove-from-cart/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login'); // or any login route you use
  }

  let proId = req.params.id;
  let userId = req.session.user._id;

  try {
    await userHelpers.removeFromCart(proId, userId);
    res.redirect('/cart');
  } catch (err) {
    console.error('Error removing product from cart:', err);
    res.status(500).send('Something went wrong');
  }
});
router.get('/place-order', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const userFromSession = req.session.user;

  // ✅ This makes sure all fields are direct/own properties
  const user = JSON.parse(JSON.stringify(userFromSession));  // convert to plain object

  const total = await userHelpers.getTotalAmount(user._id);

  res.render('user/place-order', { user, total });
});
router.post('/place-order', async (req, res) => {
  try {
    let orderId = await userHelpers.placeOrder(req.body);

    if (req.body['payment-method'] === 'COD') {
      await userHelpers.clearUserCart(req.body.userId);
      res.json({ cod: true, status: 'order placed successfully' });
    } else {
      // ✅ Instead of placing, redirect to mock payment page
      const query = new URLSearchParams(req.body).toString();
      res.json({ online: true, redirectUrl: '/mock-payment?' + query });
    }
  } catch (err) {
    console.log("❌ Order Error:", err);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/order-success', async (req, res) => {
  if (req.query.userId) {
    await userHelpers.clearUserCart(req.query.userId);
  }
  res.render('user/order-success');
});

router.get('/view-orders', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');  // Redirect if user not logged in
  }

  try {
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    res.render('user/view-orders', { user: req.session.user, orders });
  } catch (err) {
    console.log("❌ Error fetching orders:", err);
    res.status(500).send("Something went wrong");
  }
});


router.get('/view-order-products/:id', async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await db.get().collection('order').findOne({ _id: new ObjectId(orderId) });

    if (!order || !Array.isArray(order.products)) {
      return res.status(404).send('Order or products not found');
    }

    const productIds = order.products.map(p => new ObjectId(p.item));

    const products = await db.get().collection('product')
      .find({ _id: { $in: productIds } })
      .toArray();

    const detailedProducts = products.map(prod => {
      const cartItem = order.products.find(p => p.item.toString() === prod._id.toString());
      return {
        ...prod,
        quantity: cartItem.quantity
      };
    });

    res.render('user/order-product-view', { products: detailedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong');
  }
});
router.get('/mock-payment', async (req, res) => {
  const orderData = req.query;

  // ✅ Just render the payment simulation page
  res.render('mock-payment', { order: orderData });
});
router.post('/confirm-payment', async (req, res) => {
  const orderId = req.body.orderId;
  const userId = req.body.userId;

  await db.get().collection('order').updateOne(
    { _id: new ObjectId(orderId) },
    { $set: { status: 'placed' } }
  );

  await userHelpers.clearUserCart(userId);

  res.redirect('/order-success?userId=' + userId);
});






module.exports = router;
