import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../src/app.js';
import Post from '../src/models/post.js';
import Comment from '../src/models/comment.js';
import User from '../src/models/user.js';
import { disconnect } from '../src/db.js';

describe('API Routes', () => {
  let app: Express;
  const TEST_MONGODB_URI: string = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/posts-app-test';

  beforeAll(async () => {
    // Set environment variables for testing
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';

    // Wait for app to be created with MongoDB connection
    app = await createApp(TEST_MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up database and disconnect
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await User.deleteMany({});
    await disconnect();
  });

  let accessToken: string;
  let testUserId: string;

  beforeEach(async () => {
    // Clean up before each test
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await User.deleteMany({});

    // Register and login a test user
    const userData = {
      username: 'TestUser',
      email: 'test@example.com',
      password: 'password123'
    };
    await request(app).post('/auth/register').send(userData);
    const res = await request(app).post('/auth/login').send(userData);
    accessToken = res.body.accessToken;
    testUserId = res.body._id;
  });

  describe('POST /post', () => {
    test('should create a new post', async () => {
      const postData = {
        title: 'Test Post',
        body: 'This is a test post',
      };

      const response = await request(app)
        .post('/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(postData.title);
      expect(response.body.body).toBe(postData.body);
      expect(response.body.sender).toBe(testUserId);
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ body: 'Missing title and sender' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /posts', () => {
    test('should return empty array when no posts exist', async () => {
      const response = await request(app)
        .get('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ sender: 'User1' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((post: any) => post.sender === 'User1')).toBe(true);
    });

    test('should return 400 if sender parameter is missing', async () => {
      const response = await request(app)
        .get('/post')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body._id).toBe(post._id.toString());
      expect(response.body.title).toBe('Single Post');
    });

    test('should return 404 if post not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/post/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/post/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.body).toBe(updateData.body);
      expect(response.body.sender).toBe('OriginalSender');
    });

    test('should return 404 if post not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/post/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        body: 'This is a comment',
      };

      const response = await request(app)
        .post('/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.postId).toBe(post._id.toString());
      expect(response.body.sender).toBe(testUserId);
      expect(response.body.body).toBe(commentData.body);
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/comment')
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body._id).toBe(comment._id.toString());
      expect(response.body.body).toBe('Comment body');
    });

    test('should return 404 if comment not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/comment/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.body).toBe(updateData.body);
      expect(response.body.sender).toBe('OriginalSender');
    });

    test('should return 404 if comment not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/comment/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((comment: any) => comment.postId === post1._id.toString())).toBe(true);
    });

    test('should return empty array if post has no comments', async () => {
      const post = await Post.create({
        title: 'Post without comments',
        body: 'Body',
        sender: 'User1',
      });

      const response = await request(app)
        .get(`/post/${post._id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  // Auth routes tests
  describe('POST /auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        username: 'NewUser',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.username).toBe(userData.username);
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'TestUser' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 if user already exists', async () => {
      const userData = {
        username: 'ExistingUser',
        email: 'existing@example.com',
        password: 'password123',
      };

      // Register first time
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    test('should login with valid credentials', async () => {
      const userData = {
        username: 'LoginUser',
        email: 'login@example.com',
        password: 'password123',
      };

      // Register user first
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Login
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('_id');
    });

    test('should return 400 with invalid email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 with invalid password', async () => {
      const userData = {
        username: 'LoginUser2',
        email: 'login2@example.com',
        password: 'password123',
      };

      // Register user first
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Try to login with wrong password
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Get refresh token from login
      const userData = {
        username: 'LogoutUser',
        email: 'logout@example.com',
        password: 'password123',
      };
      await request(app).post('/auth/register').send(userData);
      const loginRes = await request(app).post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      refreshToken = loginRes.body.refreshToken;
    });

    test('should logout successfully with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.text).toContain('Logged out successfully');
    });

    test('should return 400 if refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Get refresh token from login
      const userData = {
        username: 'RefreshUser',
        email: 'refresh@example.com',
        password: 'password123',
      };
      await request(app).post('/auth/register').send(userData);
      const loginRes = await request(app).post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      refreshToken = loginRes.body.refreshToken;
    });

    test('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(refreshToken);
    });

    test('should return 401 if refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({})
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 403 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid_token' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  // User routes tests
  describe('GET /users', () => {
    test('should return all users', async () => {
      // Create additional users
      await User.create({
        username: 'User1',
        email: 'user1@example.com',
        password: 'hashedpassword',
      });
      await User.create({
        username: 'User2',
        email: 'user2@example.com',
        password: 'hashedpassword',
      });

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      // Verify passwords are not included
      response.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('refreshTokens');
      });
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/users')
        .expect(401);

      expect(response.text).toContain('Access Denied');
    });
  });

  describe('GET /users/:id', () => {
    let userId: any;

    beforeEach(async () => {
      const user = await User.create({
        username: 'GetUser',
        email: 'getuser@example.com',
        password: 'hashedpassword',
      });
      userId = user._id;
    });

    test('should return user by ID', async () => {
      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body._id).toBe(userId.toString());
      expect(response.body.username).toBe('GetUser');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('refreshTokens');
    });

    test('should return 404 if user not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/users/${userId}`)
        .expect(401);

      expect(response.text).toContain('Access Denied');
    });
  });


  describe('PUT /users/:id', () => {
    let userId: any;

    beforeEach(async () => {
      const user = await User.create({
        username: 'UpdateUser',
        email: 'updateuser@example.com',
        password: 'hashedpassword',
      });
      userId = user._id;
    });

    test('should update a user', async () => {
      const updateData = {
        username: 'UpdatedUsername',
        email: 'updated@example.com',
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.username).toBe(updateData.username);
      expect(response.body.email).toBe(updateData.email);
      expect(response.body).not.toHaveProperty('password');
    });

    test('should update user password', async () => {
      const updateData = {
        password: 'newPassword123',
      };

      const response = await request(app)
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      // Verify password was changed by checking refreshTokens were cleared
      const updatedUser = await User.findById(userId);
      expect(updatedUser).not.toBeNull();
      if (updatedUser) {
        expect(updatedUser.refreshTokens).toEqual([]);
      }
    });

    test('should return 404 if user not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/users/${userId}`)
        .send({ username: 'Updated' })
        .expect(401);

      expect(response.text).toContain('Access Denied');
    });
  });

  describe('DELETE /users/:id', () => {
    let userId: any;

    beforeEach(async () => {
      const user = await User.create({
        username: 'DeleteUser',
        email: 'deleteuser@example.com',
        password: 'hashedpassword',
      });
      userId = user._id;
    });

    test('should delete a user', async () => {
      const response = await request(app)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted successfully');

      // Verify user is actually deleted
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    test('should return 404 if user not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(401);

      expect(response.text).toContain('Access Denied');
    });
  });
});
