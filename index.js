const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.send('Lab server is running');
})

app.listen(port, ()=>{
    console.log(`server is running on port: ${port}`);
})


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
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    const featuredCollection = client.db('labDB').collection('featured');
    const allTestCollection = client.db('labDB').collection('alltests')


    app.get('/featured', async(req, res)=>{
      const cursor = featuredCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/alltests', async(req, res)=>{
      const cursor = allTestCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/alltests/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await allTestCollection.findOne(query);
      res.send(result);
    })




  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
