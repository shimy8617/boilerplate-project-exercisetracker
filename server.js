const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = mongoose
const bodyParser = require('body-parser')


// Schemas
let userSchema = new Schema ({
  username: { type: String, required: true },
  Exercises: [{
    description: String,
    duration: Number, 
    date: Date
}]
});

let exerciseSchema = new Schema ({
  username:  { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
})

const logSchema = new Schema({
  username: String,
  count: Number,
  log: Array,
})

// Models
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
const LogInfo = mongoose.model('logInfo', logSchema);
const getUsernameById = (id) => users.find(user => user.id === id).username;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{
  console.log('database connected.')
}).catch((err) => console.log(err.message));

app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//empty object => no selection criteria
app.get('/api/users', (req, res) => {
  User.find({}, (err, arrayOfUsers) => {
    if(!err) {
      res.json(arrayOfUsers)
    }
  });
});


// Get Data fron Post
app.post('/api/users', (req, res) => {
  let username = req.body.username;
  User.find( {username:username}, (err, personData) => {
    if(err) {
      console.log(err);
    } else {
      if(personData.length === 0) {
        const newUser = new User ({
          username: req.body.username,
          _id: req.body.id
        })
        newUser.save((err, data) => {
          if(err) {
            console.log("Error saving data")
          } else {
            res.json({
              username: data.username,
              _id: data.id
            })
          }
        })
      }  else {
        res.send("Username already Exists")
      }
    }
  })
});


app.post ('/api/users/:_id/exercises', (req, res) => {
  let idFirst = {"id": req.params._id};
  let dateSupplied = new Date(req.body.date);
  let idChecked = idFirst.id;

  let noDateSupplied = () => {
    if(dateSupplied instanceof Date && !isNaN(dateSupplied)) {
      return dateSupplied
    } else {
      dateSupplied = new Date();
    }
  }

  User.findById(idChecked, (err, data) => {
    noDateSupplied(dateSupplied);
    if (err || !data) {
      console.log("error with id=> ", err);
    } else {
      const test = new Exercise({
        "username": data.username,
        "description": req.body.description,
        "duration": req.body.duration,
        "date": dateSupplied.toDateString(),
      })

      test.save((err, data) => {
        if (err) {
          console.log("error saving=> ", err);
        } else {
          console.log("saved exercise successfully");
          res.json({
            "username": data.username,
            "description": data.description,
            "duration": data.duration,
            "date": data.date.toDateString(),
            "_id": idChecked,
          })
        }
      })
    }
  })
});



app.get('/api/users/:_id/logs', (req, res) => {
  const { from, to, limit } = req.query;
  let idFirst = { "id": req.params._id };
  let idChecked = idFirst.id;

  // Check ID
  User.findById(idChecked, (err, data) => {
    var query = {
      username: data.username
    }

    if (from !== undefined && to === undefined) {
      query.date = { $gte: new Date(from)}
    } else if (to !== undefined && from === undefined) {
      query.date = { $lte: new Date(to) }
    } else if (from !== undefined && to !== undefined) {
      query.date = { $gte: new Date(from), $lte: new Date(to)}
    }

  let limitChecker = (limit) => {
    let maxLimit = 100;
    if (limit) {
      return limit;
    } else {
      return maxLimit
    }
  }

  if (err) {
    console.log("error with ID=> ", err)
  } else {

    Exercise.find((query), null, {limit: limitChecker(+limit)}, (err, docs) => {
      let loggedArray = [];
      if (err) {
        console.log("error with query=> ", err);
      } else {

        let documents = docs;
        let loggedArray = documents.map((item) => {
          return {
            "description": item.description,
            "duration": item.duration,
            "date": item.date.toDateString()
          }
        })

        const test = new LogInfo({
          "username": data.username,
          "count": loggedArray.length,
          "log": loggedArray,
        })

        test.save((err, data) => {
          if (err) {
            console.log("error saving exercise=> ", err)
          } else {
            console.log("saved exercise successfully");
            res.json({
              "_id": idChecked,
              "username": data.username,
              "count": data.count,
              "log": loggedArray
            })
          }
        })
      }
    })
  }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
