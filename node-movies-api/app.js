const cors = require('cors');
const express = require('express');
const keycloak = require('./lib/keycloak');

const port = process.env.PORT;

const app = express();

app.use(keycloak.middleware());
app.use(express.json());
app.use(cors());

// Unsecured API endpoints
// curl http://localhost:9080/api/movies
app.get('/api/movies', (req, res) => {
  res.json( movies =  [
    {
      "imdbId": "1",
      "title": "Movie 1",
      "director": "Director 1",
      "year": "2022",
      "poster": "/images/poster1.jpg"
    },
    {
      "imdbId": "2",
      "title": "Movie 2",
      "director": "Director 2",
      "year": "2023",
      "poster": "/images/poster2.jpg"
    },
    {
      "imdbId": "3",
      "title": "Movie 3",
      "director": "Director 3",
      "year": "2024",
      "poster": "/images/poster3.jpg"
    }
  ]);
});

// curl http://localhost:9080/api/movies/{imdbId}
app.get('/api/movies/:imdbId', (req, res) => {
  console.log(req,"-------____REQUEST");
  res.json(movies =  [
    {
      "imdbId": "1",
      "title": "Movie 1",
      "director": "Director 1",
      "year": "2022",
      "poster": "/images/poster1.jpg"
    },
    {
      "imdbId": "2",
      "title": "Movie 2",
      "director": "Director 2",
      "year": "2023",
      "poster": "/images/poster2.jpg"
    },
    {
      "imdbId": "3",
      "title": "Movie 3",
      "director": "Director 3",
      "year": "2024",
      "poster": "/images/poster3.jpg"
    }
  ]);
});

// Secured API endpoints
app.get('/api/userextras/me', keycloak.protect(['MOVIES_ADMIN','MOVIES_USER']), (req, res) => {
  res.json( movies =  [
    {
      "imdbId": "1",
      "title": "Movie 1",
      "director": "Director 1",
      "year": "2022",
      "poster": "/images/poster1.jpg"
    },
    {
      "imdbId": "2",
      "title": "Movie 2",
      "director": "Director 2",
      "year": "2023",
      "poster": "/images/poster2.jpg"
    },
    {
      "imdbId": "3",
      "title": "Movie 3",
      "director": "Director 3",
      "year": "2024",
      "poster": "/images/poster3.jpg"
    }
  ]);
});

// Secured API endpoints
app.post('/api/userextras/me', keycloak.protect(['MOVIES_ADMIN','MOVIES_USER']), (req, res) => {
  res.json({ updated: true, avatar: req.body.avatar });
});

// Secured API endpoints only for admin
// Use keycloak.protect('realm:MOVIES_MANAGER') or keycloak.protect(['MOVIES_MANAGER'])
app.post('/api/movies', keycloak.protect(['MOVIES_MANAGER']), (req, res) => {
  console.log('User authorized', req.kauth.grant.access_token.content);
  res.status(201).json(req.body);
});

// Secured API endpoints only for admin
app.delete('/api/movies/:imdbId', keycloak.protect('realm:MOVIES_MANAGER'), (req, res) => {
  res.status(204).send();
});

// Secured API endpoints both admin, user
app.post('/api/movies/:imdbId/comments', keycloak.protect(['MOVIES_MANAGER','USER']), (req, res) => {
  res.status(201).json({ imdbId: req.params.imdbId, comment: req.body.text });
});

app.listen(port, () => {
  console.log(`Server Started at ${port}`);
});
