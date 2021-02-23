var express = require('express');
var router = express.Router();
const mongo = require('../db');
const dbName = 'pizzacorner';
let collectionName = 'users';
const auth = require('../jwt');

router.post('/login', function (req, res, next) {
  const client = new mongo.client(mongo.url, { useNewUrlParser: true, useUnifiedTopology: true });

  client.connect(async (err) => {
    const db = await client.db(dbName);
    const record = await db.collection(collectionName).findOne({ email: req.body.email });
    if (!!record) {
      const passMatch = await db.collection(collectionName).findOne({ password: req.body.password });
      if (!!passMatch) {
        const token = auth.createJWT({ email: record.email, role: record.role, name: record.name });
        res.json({ message: 'Login success', token, role: record.role, email: record.email, name: record.name, statusCode: 200 });
      } else {
        res.json({ message: 'Invalid Password. Please try again!', statusCode: 500 });
      }
    } else {
      res.json({ message: "Entered email doesn't exist.", statusCode: 500 });
    }
    client.close();
  });
});

module.exports = router;
