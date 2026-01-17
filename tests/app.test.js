import request from 'supertest';
import { createApp } from '../src/app.js';
import Post from '../src/models/post.js';
import Comment from '../src/models/comment.js';
import { disconnect } from '../src/db.js';

describe('API Routes', () => {
  let app;
  const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/posts-app-test';

  beforeAll(async () => {
    // Wait for app to be created with MongoDB connection
    app = await createApp(TEST_MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up database and disconnect
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await Post.deleteMany({});
    await Comment.deleteMany({});
  });

  describe('POST /post', () => {
    test('should create a new post', async () => {
      const postData = {
        title: 'Test Post',
        body: 'This is a test post',
        sender: 'TestUser',
      };

      const response = await request(app)
        .post('/post')
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(postData.title);
      expect(response.body.body).toBe(postData.body);
      expect(response.body.sender).toBe(postData.sender);
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/post')
        .send({ body: 'Missing title and sender' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /posts', () => {
    test('should return empty array when no posts exist', async () => {
      const response = await request(app)
        .get('/posts')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    test('should return all posts', async () => {
      // Create test posts
      const post1 = await Post.create({
        title: 'Post 1',
        body: 'Body 1',
        sender: 'User1',
      });
      const post2 = await Post.create({
        title: 'Post 2',
        body: 'Body 2',
        sender: 'User2',
      });

      const response = await request(app)
        .get('/posts')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('Post 2'); // Sorted by createdAt desc
      expect(response.body[1].title).toBe('Post 1');
    });
  });

  describe('GET /post?sender=...', () => {
    test('should return posts by sender', async () => {
      await Post.create({
        title: 'Post by User1',
        body: 'Body',
        sender: 'User1',
      });
      await Post.create({
        title: 'Post by User2',
        body: 'Body',
        sender: 'User2',
      });
      await Post.create({
        title: 'Another Post by User1',
        body: 'Body',
        sender: 'User1',
      });

      const response = await request(app)
        .get('/post')
        .query({ sender: 'User1' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(post => post.sender === 'User1')).toBe(true);
    });

    test('should return 400 if sender parameter is missing', async () => {
      const response = await request(app)
        .get('/post')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('sender');
    });
  });

  describe('GET /post/:id', () => {
    test('should return a single post by ID', async () => {
      const post = await Post.create({
        title: 'Single Post',
        body: 'Body',
        sender: 'User1',
      });

      const response = await request(app)
        .get(`/post/${post._id}`)
        .expect(200);

      expect(response.body._id).toBe(post._id.toString());
      expect(response.body.title).toBe('Single Post');
    });

    test('should return 404 if post not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/post/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/post/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /post/:id', () => {
    test('should update a post', async () => {
      const post = await Post.create({
        title: 'Original Title',
        body: 'Original Body',
        sender: 'OriginalSender',
      });

      const updateData = {
        title: 'Updated Title',
        body: 'Updated Body',
        sender: 'UpdatedSender',
      };

      const response = await request(app)
        .put(`/post/${post._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.body).toBe(updateData.body);
      expect(response.body.sender).toBe(updateData.sender);
    });

    test('should return 404 if post not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/post/${fakeId}`)
        .send({ title: 'Updated', body: 'Updated', sender: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /comment', () => {
    test('should create a new comment', async () => {
      const post = await Post.create({
        title: 'Post for Comment',
        body: 'Body',
        sender: 'User1',
      });

      const commentData = {
        postId: post._id.toString(),
        sender: 'Commenter',
        body: 'This is a comment',
      };

      const response = await request(app)
        .post('/comment')
        .send(commentData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.postId).toBe(post._id.toString());
      expect(response.body.sender).toBe(commentData.sender);
      expect(response.body.body).toBe(commentData.body);
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/comment')
        .send({ body: 'Missing postId and sender' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /comment/:id', () => {
    test('should return a single comment by ID', async () => {
      const post = await Post.create({
        title: 'Post',
        body: 'Body',
        sender: 'User1',
      });

      const comment = await Comment.create({
        postId: post._id,
        sender: 'Commenter',
        body: 'Comment body',
      });

      const response = await request(app)
        .get(`/comment/${comment._id}`)
        .expect(200);

      expect(response.body._id).toBe(comment._id.toString());
      expect(response.body.body).toBe('Comment body');
    });

    test('should return 404 if comment not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/comment/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /comment/:id', () => {
    test('should update a comment', async () => {
      const post = await Post.create({
        title: 'Post',
        body: 'Body',
        sender: 'User1',
      });

      const comment = await Comment.create({
        postId: post._id,
        sender: 'OriginalSender',
        body: 'Original body',
      });

      const updateData = {
        body: 'Updated body',
        sender: 'UpdatedSender',
      };

      const response = await request(app)
        .put(`/comment/${comment._id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.body).toBe(updateData.body);
      expect(response.body.sender).toBe(updateData.sender);
    });

    test('should return 404 if comment not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/comment/${fakeId}`)
        .send({ body: 'Updated', sender: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /comment/:id', () => {
    test('should delete a comment', async () => {
      const post = await Post.create({
        title: 'Post',
        body: 'Body',
        sender: 'User1',
      });

      const comment = await Comment.create({
        postId: post._id,
        sender: 'Commenter',
        body: 'Comment to delete',
      });

      const response = await request(app)
        .delete(`/comment/${comment._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Verify comment is actually deleted
      const deletedComment = await Comment.findById(comment._id);
      expect(deletedComment).toBeNull();
    });

    test('should return 404 if comment not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/comment/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /post/:postId/comments', () => {
    test('should return all comments for a post', async () => {
      const post1 = await Post.create({
        title: 'Post 1',
        body: 'Body',
        sender: 'User1',
      });
      const post2 = await Post.create({
        title: 'Post 2',
        body: 'Body',
        sender: 'User2',
      });

      await Comment.create({
        postId: post1._id,
        sender: 'Commenter1',
        body: 'Comment 1 for Post 1',
      });
      await Comment.create({
        postId: post1._id,
        sender: 'Commenter2',
        body: 'Comment 2 for Post 1',
      });
      await Comment.create({
        postId: post2._id,
        sender: 'Commenter3',
        body: 'Comment for Post 2',
      });

      const response = await request(app)
        .get(`/post/${post1._id}/comments`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(comment => comment.postId === post1._id.toString())).toBe(true);
    });

    test('should return empty array if post has no comments', async () => {
      const post = await Post.create({
        title: 'Post without comments',
        body: 'Body',
        sender: 'User1',
      });

      const response = await request(app)
        .get(`/post/${post._id}/comments`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});

