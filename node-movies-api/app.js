const cors = require('cors');
const express = require('express');
const keycloak = require('./lib/keycloak');
const { v4: uuid } = require('uuid');
const port = process.env.PORT;

const app = express();

app.use(keycloak.middleware());
app.use(express.json());
app.use(cors());

// Unsecured API endpoints
// curl http://localhost:9080/api/movies

function checkRole(role) {
  return function (req, res, next) {

    if (!req.kauth || !req.kauth.accessToken) {
      console.error('Keycloak token is missing or not initialized properly.');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const roles = req.kauth.accessToken.content.realm_access.roles;
      console.log('User Roles:', roles);
      const hasRole = roles.some(role => allowedRoles.includes(role));
      if (hasRole) {
        next();
      } else {
        res.status(403).json({ message: 'Forbidden' });
      }
    } catch (error) {
      console.error('Error accessing roles:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
}

let movies = [
  {
      "imdbId": uuid(),
      "title": "Iron Man Returns",
      "director": "Jon Favreau",
      "year": "2023",
      "poster": "https://cdna.artstation.com/p/assets/images/images/040/052/808/large/milan-bhanderi-iron-man-will-riturn.jpg?1627712492",
      "comments": [
          { "id": uuid(), "text": "Iron Man never disappoints!", "createdAt": new Date() },
          { "id": uuid(), "text": "Stark's comeback is phenomenal!", "createdAt": new Date() }
      ]
  },
  {
      "imdbId": uuid(),
      "title": "Thor: Lightning Reborn",
      "director": "Taika Waititi",
      "year": "2024",
      "poster": "https://m.media-amazon.com/images/I/51mFxwCLdNL._AC_UF894,1000_QL80_.jpg",
      "comments": [
          { "id": uuid(), "text": "Thor and his hammer are unstoppable.", "createdAt": new Date() },
          { "id": uuid(), "text": "The visuals are stunning!", "createdAt": new Date() }
      ]
  },
  {
      "imdbId": uuid(),
      "title": "Captain Marvel: Galaxy's Fury",
      "director": "Anna Boden",
      "year": "2023",
      "poster": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9kvawQai0XuzsVn70hsrvYAC1qTcmspUUMnmQQLN_5A&s",
      "comments": [
          { "id": uuid(), "text": "Brie Larson shines as Captain Marvel.", "createdAt": new Date() },
          { "id": uuid(), "text": "Epic battles in space!", "createdAt": new Date() }
      ]
  },
  {
      "imdbId": uuid(),
      "title": "Black Widow: The Red Ledger",
      "director": "Cate Shortland",
      "year": "2024",
      "poster": "https://upload.wikimedia.org/wikipedia/en/e/e9/Black_Widow_%282021_film%29_poster.jpg",
      "comments": [
          { "id": uuid(), "text": "Black Widow at her best.", "createdAt": new Date() },
          { "id": uuid(), "text": "The storyline is incredibly engaging.", "createdAt": new Date() }
      ]
  },
  {
      "imdbId": uuid(),
      "title": "Guardians of the Galaxy Vol. 4",
      "director": "James Gunn",
      "year": "2025",
      "poster": "https://static.wixstatic.com/media/2b21c7_3787abb8d4984c1e9be6e398c36f4384~mv2.jpg/v1/fill/w_600,h_338,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/Guardians.jpg",
      "comments": [
          { "id": uuid(), "text": "Funniest of the series!", "createdAt": new Date() },
          { "id": uuid(), "text": "Rocket and Groot steal the show again.", "createdAt": new Date() }
      ]
  }
];

let userAvtar =['admin'];


// Unsecured API endpoints
// curl http://localhost:9080/api/movies
app.get('/api/movies', (req, res) => {
  res.json(movies);
});

// curl http://localhost:9080/api/movies/{imdbId}
app.get('/api/movies/:imdbId', (req, res) => {
  const movie = movies.find(m => m.imdbId === req.params.imdbId);
  if (movie) {
    res.json(movie);
  } else {
    res.status(404).send({ error: "Movie not found" });
  }
});

// Secured API endpoints
app.post('/api/movies', keycloak.protect('realm:MOVIES_MANAGER'), (req, res) => {
  //console.log('User authorized', req.kauth.grant.access_token.content);
  const { title, director, year, poster } = req.body;
  const newMovie = { imdbId: uuid(), title, director, year, poster, comments: [] };
  movies.push(newMovie);
  res.status(201).json(newMovie);
});

// Secured API endpoints
app.post('/api/userextras/me', keycloak.protect(['MOVIES_ADMIN','MOVIES_USER']), (req, res) => {
  userAvtar=[]
  userAvtar.push(req.body.avatar)
  res.json({ updated: true, avatar: req.body.avatar });
});

app.get('/api/userextras/me', keycloak.protect(['MOVIES_ADMIN','MOVIES_USER']), (req, res) => {
  // res.json({ updated: true, avatar: 1471 });
  res.json({ updated: true, avatar: userAvtar[0] });
});

// Secured API endpoints only for admin
// Use keycloak.protect('realm:MOVIES_MANAGER') or keycloak.protect(['MOVIES_MANAGER'])
app.post('/api/movies', keycloak.protect(['MOVIES_MANAGER']), (req, res) => {
  console.log('User authorized', req.kauth.grant.access_token.content);
  res.status(201).json(req.body);
});

// Secured API endpoints only for admin
app.delete('/api/movies/:imdbId', keycloak.protect('realm:MOVIES_MANAGER'), (req, res) => {
  movies = movies.filter(m => m.imdbId !== req.params.imdbId);
  res.status(204).send();
});

// Secured API endpoints both admin, user
app.post('/api/movies/:imdbId/comments', keycloak.protect(['MOVIES_MANAGER', 'USER']), (req, res) => {
  const { text } = req.body;
  const movie = movies.find(m => m.imdbId === req.params.imdbId);
  if (movie) {
    const newComment = { id: uuid(), text, createdAt: new Date() };
    movie.comments.push(newComment);
    res.status(201).json(newComment);
  } else {
    res.status(404).send({ error: "Movie not found" });
  }
});

app.listen(port, () => {
  console.log(`Server Started at ${port}`);
});
