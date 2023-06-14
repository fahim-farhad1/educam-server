const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
// verify jwt 
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" });
  }
  const token = authorization.split(" ")[1];



  // verify a token symmetric
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorize access" });
    }
    req.decoded = decoded;
    next();
  });
};
    // mongo db connection 
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


    // JWT
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2h",
      });
      res.send({ token });
    });



    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await studentCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };


    // verify instructors
    const verifyInstructors = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await studentCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };



    // Students related API
    app.post("/students", async (req, res) => {
      const student = req.body;
      //   console.log(student);
      const query = { email: student.email };
      const existingUser = await studentCollection.findOne(query);
      //   console.log("user exit:-", existingUser);
      if (existingUser) {
        return res.send({ message: "student already Exists" });
      }
      const result = await studentCollection.insertOne(student);
      res.send(result);
    });


    // get Students
    app.get("/students", async (req, res) => {
      const result = await studentCollection.find().toArray();
      res.send(result);
    });


    // students query
    app.get("/students/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await studentCollection.find(query).toArray();
      res.send(result);
    });



    // admin related api
    app.get("/students/admin/:email",async (req, res) => {
        const email = req.params.email;
        console.log(email);
        if (req.decoded.email !== email) {
          res.send({ admin: false });
        }
        const query = { email: email };
        const admin = await studentCollection.findOne(query);
        const result = { admin: admin?.role === "admin" };
        console.log(result);
        res.send(result);
      }
    );


    // role set 
    app.patch("/students/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      //   console.log(email);
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await studentCollection.updateOne(query, updateDoc);
      res.send(result);
    });


    // check  role 
    app.get("/role/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };

      const options = {
        projection: {role: 1, _id: -1},
      };
      const result = await studentCollection.findOne(query,options);
      console.log("165",result);
      res.send(result); 
    });

    // set role instructors
    app.patch("/students/instructor/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      //   console.log(email);
      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await studentCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //Student Add  Class Collections related API
    app.post("/addtoclass", async (req, res) => {
      const addClass = req.body;
      //   console.log(addClass);
      const query = { classId: addClass.classId };
      const existingClass = await addToClassCollection.findOne(query);
      // console.log('class', existingClass);
      if (existingClass) {
        return res.send({ message: "Class already Exists" });
      }
      const result = await addToClassCollection.insertOne(addClass);
      res.send(result);
    });
// add class 
    app.get("/addtoclass", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if (email !== decodedEmail) {
        return res
          .status(403)
          .send({ error: true, message: "provident access" });
      }
      const query = { email: email };
      const result = await addToClassCollection.find(query).toArray();
      res.send(result);
    });
// Upload class 
//     app.post('/uploadclass', async(req, res) =>{
        
//     })
    //  INSTRUCTORS ADD CLASS
    app.post("/uploadclass", async (req, res) => {
      const newClass = req.body;
      const result = await courseCollection.insertOne(newClass);
      res.send(result);
    });

    // Instructors get her class
    app.get("/instructorclass/:email", async (req, res) => {
        const email = req.params.email;
        console.log("240",email);
        if (!email) {
         return res.send([]);
        }
        const query = { instructor_email: email };
        const result = await courseCollection.find(query).toArray();
        console.log('246',result);
        res.send(result);
      });


    // Delete items
    app.delete("/addtoclass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await addToClassCollection.deleteOne(query);
      res.send(result);
    });

    // popular classes related api
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
