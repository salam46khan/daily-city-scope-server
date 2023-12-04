const express = require('express');
const app = express()
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware 
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wueeg5w.mongodb.net/?retryWrites=true&w=majority`;

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
        await client.connect();


        const newsCollection = client.db('cityScopeDB').collection('news');
        const userCollection = client.db('cityScopeDB').collection('users');
        const publisherCollection = client.db('cityScopeDB').collection('publisher');


        // news collection 
        app.get('/news', async (req, res) => {
            const query = {status: 'pending'}
            // const query = {isPrimium: true}
            const result = await newsCollection.find(query).sort({ date: -1 }).toArray()
            res.send(result)
        })
        app.get('/allnews', async (req, res) => {
            const result = await newsCollection.find().sort({ date: -1 }).toArray()
            res.send(result)
        })

        app.post('/news', async (req, res)=>{
            const news = req.body;
            const result = await newsCollection.insertOne(news)
            res.send(result)
        })

        app.get('/news/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) };
            const result = await newsCollection.findOne(query)
            res.send(result)
        })


        app.get('/search', async (req, res)=>{
            let query = {}
            if(req.query?.name){
                query = {title : {$regex: req.query.name, $options: 'i'}}
            }
            const cursor = newsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/filter', async(req, res)=>{
            const filtertext = req.query.filtertext;
            const query = {author : { $regex: filtertext, $options: 'i' }};
            const result =await newsCollection.find(query).toArray()
            res.send(result)
            console.log(filtertext);
        })
        app.get('/mynews', async(req, res)=>{
            const authorEmail = req.query.authorEmail;
            const query = {authorEmail : authorEmail};
            const result =await newsCollection.find(query).toArray()
            res.send(result)
            // console.log(authorEmail);
        })

        app.put('/news/:id', async (req, res)=>{
            const id = req.params.id;
            const updateNews = req.body;
            const filter = {_id: new ObjectId(id)};
            const options = {upsert: true};
            const update = {
                $set: {
                    title: updateNews.title,
                    category: updateNews.category,
                    location: updateNews.location,
                    description: updateNews.description,
                    isPrimium: updateNews.isPrimium
                }
            }
            const result = await newsCollection.updateOne(filter, update, options)
            res.send(result)
        })

        app.delete('/mynews/:id', async (req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result =await newsCollection.deleteOne(query)
            res.send(result)
        })

        // user collection 
        app.post('/users', async (req, res)=>{
            const user = req.body;
            
            const query = {email :  user.email}
            const existingUser = await userCollection.findOne(query)
            if(existingUser){
                return res.send({message: 'user exists', insertedId: null}) 
            }
            const result = await userCollection.insertOne(user);
            res.send(result)
        })
        app.get('/users', async (req, res)=>{
            
            const result = await userCollection.find().toArray()
            res.send(result)
        })

        app.get('/users/:id', async (req, res)=>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await userCollection.findOne(query)
            res.send(result)
        })

        app.patch('/users/:id', async (req, res)=>{
            const id = req.params.id;
            const updateProfile = req.body;
            const filter = {_id: new ObjectId(id)};
            const options = {upsert: true};
            const update = {
                $set: updateProfile
                // {
                //     phone: updateProfile?.phone,
                //     bath: updateProfile?.bath,
                //     address: updateProfile?.address,
                //     gender: updateProfile?.gender,
                //     photoURL: updateProfile?.photoURL
                // }
            }
            const result = await userCollection.updateOne(filter, update, options)
            res.send(result)
        })

        app.get('/user', async(req, res)=>{
            let query ={}
            if(req.query?.email){
                query = {email: req.query.email}
            }
            const cursor = userCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.patch('/user/admin/:id', async (req, res)=>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const options = {upsert: true};
            const update = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter,update, options)
            res.send(result)
        })

        // publisher api 
        app.post('/publisher', async (req, res)=>{
            const publisher = req.body;
            const result = await publisherCollection.insertOne(publisher)
            res.send(result)
        })
        app.get('/publisher', async (req, res)=>{
            const result = await publisherCollection.find().toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('city scope is running')
})

app.listen(port, () => {
    console.log(`city scope is running by ${port}`);
})