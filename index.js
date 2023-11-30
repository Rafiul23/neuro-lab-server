const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Lab server is running');
})

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
})

 // middlewares




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wlof2pa.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");


    const featuredCollection = client.db('labDB').collection('featured');
    const allTestCollection = client.db('labDB').collection('alltests');
    const userCollection = client.db('labDB').collection('users');
    const bannerCollection = client.db('labDB').collection('banners');
    const appointmentCollection = client.db('labDB').collection('appointments');


   

    // jwt related api
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '2h'});
      res.send({token});
    })

    const verifyToken = (req, res, next)=>{
      console.log('inside verify token', req.headers);
      if(!req.headers.authorization){
        return res.status(401).send({message:'Unauthorized access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      console.log(token)
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded)=>{
        if(error){
          return res.status(401).send({message:'Unauthorized access'});
        } 
        req.decoded = decoded;
        next();
      })
      
    }

    app.get('/user/admin/:email', verifyToken, async(req, res)=>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return req.status(403).send({message: 'Forbidden Access'});
      }
      const query = { email: email};
      const user = await userCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin';
      }
      res.send({admin});
    })

    // middleware
    const verifyAdmin = async(req, res, next)=>{
      const email = req.decoded.email;
      const query = { email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
        return res.status(403).send({message:'Forbidden Access'})
      } else {
        next();
      }
    }

    // appointments related api
    app.post('/appointment', verifyToken, async (req, res) => {
      const appointment = req.body;
      const result = await appointmentCollection.insertOne(appointment);
      res.send(result);
    })

    app.get('/appointments/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await appointmentCollection.find(query).toArray();
      res.send(result);
    })

    app.delete('/appointment/:id', verifyToken, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await appointmentCollection.deleteOne(query);
      res.send(result);
    })


    // banner related api
    app.post('/banners', verifyToken, verifyAdmin, async (req, res) => {
      const bannerInfo = req.body;
      const result = await bannerCollection.insertOne(bannerInfo);
      res.send(result);
    })

    app.delete('/banner/:id', verifyToken, verifyAdmin, async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await bannerCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/banners', verifyToken, verifyAdmin, async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    })


    // test related api
    app.get('/featured', async (req, res) => {
      const cursor = featuredCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/alltests', async (req, res) => {
      const cursor = allTestCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.delete('/test/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allTestCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/alltests/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allTestCollection.findOne(query);
      res.send(result);
    })

    app.post('/test', verifyToken, verifyAdmin, async (req, res) => {
      const test = req.body;
      const result = await allTestCollection.insertOne(test);
      res.send(result);
    })

    app.put('/test/:id', verifyToken, verifyAdmin, async (req, res) => {
      const test = req.body;
      console.log(test)
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedTest = {
        $set: {
          test_name: test.test_name,
          image: test.image,
          slot: test.slot,
          test_description: test.test_description,
          date: test.date,
          price: test.price
        }
      }
      const result = await allTestCollection.updateOne(filter, updatedTest);
      res.send(result);

    })

   

    // user related api

   

    app.post('/users', async (req, res) => {

      const user = req.body;
      const query = { email: user.email };
      const isExist = await userCollection.findOne(query);
      if (isExist) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    // make user admin
    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // block a user
    app.put('/users/block/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedStatus = {
        $set: {
          status: 'blocked'
        }
      }
      const result = await userCollection.updateOne(filter, updatedStatus);
      res.send(result);
    })

    // active a user
    app.put('/users/active/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedStatus = {
        $set: {
          status: 'active'
        }
      }
      const result = await userCollection.updateOne(filter, updatedStatus, options);
      res.send(result);
    })

    app.get('/users/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    })

    // payment intent
    app.post('/create-payment-intent', verifyToken, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
