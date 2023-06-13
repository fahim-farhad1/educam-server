const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lxtlzfc.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //DB_Collections
    const courseCollection = client.db("educamDB").collection("courses");
    const studentCollection = client.db("educamDB").collection("students");
    const addToClassCollection = client.db("educamDB").collection("addToClass");
    const instructorCollection = client
      .db("educamDB")
      .collection("Instructors");
    const reviewCollection = client.db("educamDB").collection("review");

    // Students related API
    app.post("/students", async (req, res) => {
      const student = req.body;
      console.log(student);
      const query = {email: student.email}
      const existingUser = await studentCollection.findOne(query);
      console.log('user exit:-',existingUser);
      if(existingUser){
       return res.send({message: "user already Exists"});
      }
      const result = await studentCollection.insertOne(student);
    res.send(result);
    });

    app.get("/students", async (req, res) => {
      const result = await studentCollection.find().toArray();
      res.send(result);
    });

    app.patch('/students/admin/:id', async(req, res) => {
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        console.log(id);
        const updateDoc = {
            $set: {
                role: 'admin'
            },
        }
        const result = await studentCollection.updateOne(query, updateDoc);
        res.send(result);
    })

    //Add  Class Collections related API
    app.post("/addtoclass", async (req, res) => {
      const addClass = req.body;
    //   console.log(addClass);
      const query = {classId: addClass.classId}
      const existingClass = await addToClassCollection.findOne(query);
      if(existingClass){
        res.send({message: "Class already Exists"})
      }
      const result = await addToClassCollection.insertOne(addClass);
      res.send(result);
    });

    app.get("/addedclass", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await addToClassCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/popular", async (req, res) => {
      const result = await courseCollection
        .find()
        .sort({ enrolled_students: -1 })
        .toArray();
      res.send(result);
    });

    app.get("/instructors", async (req, res) => {
      const result = await instructorCollection.find().toArray();
      res.send(result);
    });

    app.get("/classes", async (req, res) => {
      const result = await courseCollection.find().toArray();
      res.send(result);
    });

    // Delete items
    app.delete("/addedclass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addToClassCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Tumi!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
