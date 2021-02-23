var express = require('express');
var router = express.Router();
const mongo = require('../db');
const dbName = 'pizzacorner';
let collectionName = 'pizzas';
const Razorpay = require('razorpay');
const key = 'rzp_test_otAJuNIzYSCu5x';
const secret = 'jz1eXHjapyAbBHNDthU5jFaj';
const env = require('../env');

router.get('/veg-menu', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const menu = await db.collection(collectionName).find({ category: 'veg' }).toArray();
    if (!!menu) {
      res.json({ menu, statusCode: 200 });
    } else {
      res.json({ message: 'No Items Found', statusCode: 500 });
    }
    client.close();
  });
});

router.get('/non-veg-menu', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const menu = await db.collection(collectionName).find({ category: 'non-veg' }).toArray();
    if (!!menu) {
      res.json({ menu, statusCode: 200 });
    } else {
      res.json({ message: 'No Items Found', statusCode: 500 });
    }
    client.close();
  });
});

router.get('/base', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const data = await db.collection('base').find().toArray();
    if (!!data) {
      res.json({ data, statusCode: 200 });
    } else {
      res.json({ message: 'No Items Found', statusCode: 500 });
    }
    client.close();
  });
});

router.get('/cheese', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const data = await db.collection('cheese').find().toArray();
    if (!!data) {
      res.json({ data, statusCode: 200 });
    } else {
      res.json({ message: 'No Items Found', statusCode: 500 });
    }
    client.close();
  });
});

router.get('/meat', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const data = await db.collection('meat').find().toArray();
    if (!!data) {
      res.json({ data, statusCode: 200 });
    } else {
      res.json({ message: 'No Items Found', statusCode: 500 });
    }
    client.close();
  });
});

router.get('/sauce', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const data = await db.collection('sauce').find().toArray();
    if (!!data) {
      res.json({ data, statusCode: 200 });
    } else {
      res.json({ message: 'No Items Found', statusCode: 500 });
    }
    client.close();
  });
});

router.get('/veggies', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const data = await db.collection('veggies').find().toArray();
    if (!!data) {
      res.json({ data, statusCode: 200 });
    } else {
      res.json({ message: 'No Items Found', statusCode: 500 });
    }
    client.close();
  });
});

router.post('/order', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const instance = new Razorpay({
      key_id: key,
      key_secret: secret,
    });
    instance.orders.create({ amount: req.body.price, currency: 'INR', receipt: `AKPizza-${req.body._id}`, payment_capture: 0 }, async function (err, order) {
      if (err) {
        return res.status(500).json({
          message: 'Something Went Wrong',
        });
      } else {
        const data = await db
          .collection('orders')
          .insertOne({ orderId: order.id, image_url: req.body.image_url, price: req.body.price, ingredients: req.body.ingredients, category: req.body.category, email: req.body.email, category: req.body.category, name: req.body.name });
        client.close();
        return res.status(200).json({ ...order, ...data });
      }
    });
  });
});

router.post('/callback/:id', async (req, res) => {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  console.log(req.params.id);
  client.connect(async (err) => {
    const db = await client.db(dbName);
    console.log(req.body);
    if (err) {
      await db.collection('orders').remove({ orderId: req.params.id });
      res.redirect(`${env}payment/failure`);
    } else {
      const data = await db
        .collection('orders')
        .updateOne({ orderId: req.params.id }, { $set: { status: 'Order Placed', payment_id: req.body.razorpay_payment_id, razor_order_id: req.body.razorpay_order_id, razorpay_signature: req.body.razorpay_signature } });
      if (!!data) {
        res.redirect(`${env}payment/success`);
      }
    }
    client.close();
  });
});

module.exports = router;
