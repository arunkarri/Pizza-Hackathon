var express = require('express');
var router = express.Router();
const mongo = require('../db');
const dbName = 'pizzacorner';
let collectionName = 'users';
const nodemailer = require('nodemailer');
const env = require('../env');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'akk907615@gmail.com', // generated ethereal user
    pass: 'AKK!2345', // generated ethereal password
  },
});

router.post('/create-user', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const record = await db.collection(collectionName).findOne({ email: req.body.email });
    if (!!record) {
      res.json({ message: 'User already exists.', statusCode: 500 });
    } else {
      const result = await db.collection(collectionName).insertOne({ email: req.body.email, password: req.body.password, name: req.body.name, role: req.body.role });
      console.log(`result: ${result}`);
      res.json({ message: 'User Created.', statusCode: 200 });
    }
    client.close();
  });
});

router.post('/forgot', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const result = await db.collection(collectionName).findOne({ email: req.body.email });
    if (!!result) {
      let r = Math.random().toString(36).substring(7);
      await db.collection(collectionName).updateOne({ email: req.body.email }, { $set: { random_string: r } });
      const baseURL = req.protocol + '://' + req.get('host');

      let info = await transporter.sendMail({
        from: '"Arun\'s Pizza Corner" <no-reply@arunpizzacorner.com>', // sender address
        to: req.body.email, // list of receivers
        subject: `Forgot Password - ${req.body.email}`, // Subject line
        text: 'Click the below link to set your password', // plain text body
        html: `${baseURL}/users/reset/${req.body.email}/${r}`, // html body
      });

      console.log('Message sent: %s', info.messageId);
      res.json({ message: 'An email has been sent to you. Please check your mail box', statusCode: 200 });
    } else {
      res.json({ message: "User Doesn't exist!!", statusCode: 500 });
    }

    client.close();
  });
});

router.get('/reset/:email/:id', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const result = await db.collection(collectionName).findOne({ random_string: req.params.id });
    if (!!result) {
      res.redirect(`${env}reset-password/${req.params.email}`);
    } else {
      res.json({ message: 'The link is invalid. Please try again!', statusCode: 500 });
    }
    client.close();
  });
});

router.put('/reset', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const result = await db.collection(collectionName).updateOne({ email: req.body.email }, { $set: { password: req.body.password } });
    if (!!result) {
      await db.collection(collectionName).updateOne({ email: req.body.email }, { $unset: { random_string: 1 } });
      res.json({ message: 'New password is set successfully', statusCode: 200 });
    } else {
      res.json({ message: 'The link is invalid. Please try again!', statusCode: 500 });
    }
    client.close();
  });
});

router.get('/orders/:email', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const data = await db
      .collection('orders')
      .find({ $and: [{ email: req.params.email }, { status: { $exists: true } }] })
      .toArray();
    if (!!data) {
      res.json({ data, statusCode: 200 });
    } else {
      res.json({ message: 'No orders Found', statusCode: 500 });
    }
    client.close();
  });
});

module.exports = router;
