const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000




app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://needscart-30b9c.web.app",
      "needscart-30b9c.firebaseapp.com",
      "https://66bf7804d9e6ac578273918c--celebrated-meringue-6be4a9.netlify.app"
    ]
  })
);
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.MongoDB_USER}:${process.env.MongoDB_PASS}@cluster0.eugjqa9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const productsCollection = client.db('NeedsCart').collection('all_products')

    // get all products  api from db
    app.get('/all-products', async (req, res) => {

      // collecting data from params
      const search = req.query.search || '';
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || Number.MAX_VALUE;
      const brands = req.query.brands ? req.query.brands.split(',') : [];
      const categories = req.query.categories ? req.query.categories.split(',') : [];
      const sort = req.query.sort || '';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;



      // search by products name and filter by price 
      let query = {
        productName: { $regex: search, $options: 'i' },
        price: { $gte: minPrice, $lte: maxPrice },
      };


      // If the client sets the brand, then filter by brandName from MongoDB
      if (brands.length > 0) {
        query.brandName = { $in: brands };
      }

      // If the client sets the category, then filter by category from MongoDB

      if (categories.length > 0) {
        query.category = { $in: categories };
      }

      // sort data
      let sortQuery = {};
      if (sort === 'low to high') {
        sortQuery.price = 1;
      } else if (sort === 'high to low') {
        sortQuery.price = -1;
      } else if (sort === 'newest') {
        sortQuery.createdAt = -1;
      }

      // pagination
      const skip = (page - 1) * limit;
      const totalProducts = await productsCollection.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);

      const products = await productsCollection.find(query).sort(sortQuery).skip(skip).limit(limit).toArray();
      res.json({
        products,
        totalPages,
        currentPage: page
      })
    })


    app.get('/all', async (req, res) => {
      try {
        const products = await productsCollection.find().toArray();
        console.log(products);
        res.json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Needs cart runnig')
})

app.listen(port, () => {
  console.log(`server is running on ${port}`)
})