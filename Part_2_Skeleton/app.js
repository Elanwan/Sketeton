const express = require('express')
const jwt = require('jsonwebtoken')
const { get } = require('axios')
const sqlite3 = require('sqlite3').verbose()
const secretKey = 'mysecretkey'

function verifyToken(req, res, next) {
  // Get the token from the Authorization header
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  // Verify the token using the secret key
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

let db = new sqlite3.Database('./data.sqlite', (err) => {
  if (err) {
    console.error(err.message)
  }
  console.log('Connected to the chinook database.')
})

const app = express()
app.use(express.json())
app.use(express.urlencoded())
app.use(express.static('public'))

const port = 3000
app.get('/backup/users', verifyToken, async(req, res) => {
  get('https://dummyjson.com/users').then(data => {
    //store data.data.users to sqlite
    db.serialize(() => {
      db.run(`
          CREATE TABLE IF NOT EXISTS users
          (
              id
              INTEGER
              PRIMARY
              KEY,
              firstName
              TEXT,
              lastName
              TEXT
          );
      `)
      data.data.users.forEach(user => {
        db.run(`
            INSERT INTO users (id, firstName, lastName)
            VALUES (${user.id},
                    '${user.firstName}',
                    '${user.lastName}');
        `)
      })
    })
    res.status(200).json({ message: 'success' })
  })
})
app.get('/backup/users', verifyToken, async(req, res) => {
  get('https://dummyjson.com/users').then(data => {
    //store data.data.users to sqlite
    db.serialize(() => {
      db.run(`
          CREATE TABLE IF NOT EXISTS users
          (
              id
              INTEGER
              PRIMARY
              KEY,
              firstName
              TEXT,
              lastName
              TEXT
          );
      `)
      data.data.users.forEach(user => {
        db.run(`
            INSERT INTO users (id, firstName, lastName)
            VALUES (${user.id},
                    '${user.firstName}',
                    '${user.lastName}');
        `)
      })
    })
    res.status(200).json({ message: 'success' })
  })
})

app.get('/backup/posts', verifyToken, async(req, res) => {

  get('https://dummyjson.com/posts').then(data => {
    console.log(data.data)
    db.serialize(() => {
      db.run(`
          CREATE TABLE IF NOT EXISTS posts
          (
              id
              INTEGER
              PRIMARY
              KEY,
              title
              TEXT,
              body
              TEXT,
              userId
              INTEGER,
              tags
              TEXT
          );
      `)
      data.data.posts.forEach(post => {
        db.run(`INSERT INTO posts (id, title, body, userId, tags)
                values (?, ?, ?, ?, ?)`, [
          post.id,
          post.title,
          post.body,
          post.userId,
          post.tags.join(','),
        ])

      })
    })
    res.status(200).json({ message: 'success' })

  })
})
app.get('/backup/comments', verifyToken, async(req, res) => {

  get('https://dummyjson.com/comments').then(data => {
    db.serialize(() => {
      db.run(`
          CREATE TABLE IF NOT EXISTS comments
          (
              id
              INTEGER
              PRIMARY
              KEY,
              body
              TEXT,
              postId
              INTEGER,
              userId
              INTEGER
          );
      `)
      data.data.comments.forEach(comment => {
        db.run(`INSERT INTO comments (id, body, postId, userId)
                values (?, ?, ?, ?)`, [
          comment.id,
          comment.body,
          comment.postId,
          comment.user.id,
        ])

      })
    })
    res.status(200).json({ message: 'success' })

  })
})
app.get('/users', verifyToken, async(req, res) => {
  const limit = req.query.limit || 5
  const skip = req.query.skip || 0
  let data = {}

  db.serialize(() => {
    db.all(`
                SELECT *
                FROM users LIMIT ${limit}
                OFFSET ${skip}
      `
      , (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message })
        }

        data = {
          users: rows,
          skip: skip,
          limit: limit,
        }
        db.all(`
            SELECT COUNT(*) as total
            FROM users
        `, (err, rows) => {
          if (err) {
            res.status(500).json({ error: err.message })
          }
          data.total = rows[0].total
          res.status(200).json(data)

        })

      })

  })
})
//users/${userId}/posts
app.get('/users/:userId/posts', verifyToken, async(req, res) => {
  db.serialize(() => {
    db.all(`
        SELECT *
        FROM posts
        WHERE userId = ${req.params.userId}
    `, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message })
      }
      res.status(200).json({ posts: rows })
    })
  })
})
//posts/${id}
app.get('/posts/:id', verifyToken, async(req, res) => {
  db.serialize(() => {
    db.all(`
        SELECT *
        FROM posts
        WHERE id = ${req.params.id}
    `, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message })
      }
      res.status(200).json(rows.length ? rows[0] : {})
    })
  })
})

//posts/${postId}/comments
app.get('/posts/:postId/comments', verifyToken, async(req, res) => {
  db.serialize(() => {
    //user need to be added
    db.all(
      `SELECT comments.*, users.firstName, users.lastName, users.id AS user
       FROM comments
           JOIN users
       ON comments.userId = users.id
       WHERE comments.postId = ${req.params.postId};`, (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message })
        }
        res.status(200).json({
          comments: rows.map(comment => ({
            id: comment.id,
            body: comment.body,
            postId: comment.postId,
            user: {
              id: comment.user,
              firstName: comment.firstName,
              lastName: comment.lastName,
            },
          })),
        })
      })
  })
})

app.post('/clients/login', async(req, res) => {
  db.serialize(() => {
    db.all(`
        SELECT *
        FROM clients
        WHERE email = '${req.body.email}'
          AND password = '${req.body.password}'
    `, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message })
      }
      if (!rows.length) {
        res.status(401).json({ error: 'Invalid credentials' })
        return
      }
      const token = jwt.sign(rows[0], secretKey)

      // Send the token back to the client
      res.json({ token })
    })
  })
})

app.post('/clients/register', async(req, res) => {
  db.serialize(() => {
    db.run(`
        INSERT INTO clients (firstName, lastName, email, password)
        values (?, ?, ?, ?)`, [
      req.body.firstName,
      req.body.lastName,
      req.body.email,
      req.body.password,
    ], function(err) {
      if (err) {
        res.status(500).json({ error: err.message })
      }
      res.status(200).json({ id: this.lastID })
    })
  })
})

app.get('/', (req, res) => {
  db.serialize(() => {
    db.all(`
        SELECT name
        FROM sqlite_schema
        WHERE 1 = 1
          AND type = 'table'
          AND name NOT LIKE 'sqlite_%'
        ;

    `, (err, rows) => {
      if (err) {
        // console.error(err.message);
        res.status(500).json({ error: err.message })
      }

      res.status(200).json({ tables: rows })
    })
  })

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port} \nURL: http://localhost:${port}`)
})
