# Posts App

Basic Express + Mongoose app to manage posts.

Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Create a `.env` file with `MONGODB_URI` and `PORT`.

Run

```bash
npm run devstart   # development with nodemon
npm start          # production
```

Example API

- List posts: `GET /posts`
- Create post: `POST /posts` with JSON `{ "title": "Hi", "body": "..." }`
- Get post: `GET /posts/:id`
- Update post: `PUT /posts/:id` with JSON body
- Delete post: `DELETE /posts/:id`

Notes

- Default MongoDB URI: `mongodb://127.0.0.1:27017/posts-app` if `MONGODB_URI` not provided.
# posts-app
# posts-app
# posts-app
