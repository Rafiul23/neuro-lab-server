const express = require('express');
const cors = require('cors');
const app = express();
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