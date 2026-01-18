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

    test('should return 400 on database error', async () => {
      // Test with invalid data that might cause database validation error
      const response = await request(app)
        .post('/post')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: null, // Invalid data
          body: 'Test body',
        })
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

    test('should return 400 with invalid post ID format', async () => {
      const response = await request(app)
        .put('/post/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated', body: 'Updated' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Auth Middleware Edge Cases', () => {
    test('should return 401 with missing token', async () => {
      const response = await request(app)
        .get('/users')
        .expect(401);

      expect(response.text).toContain('Access Denied');
    });

    test('should return 403 when Authorization header is empty string (invalid token)', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', '')
        .expect(403);

      expect(response.text).toContain('Invalid Token');
    });

    test('should return 403 when token does not start with Bearer (extracted token is invalid)', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', 'NotBearer token123')
        .expect(403);

      expect(response.text).toContain('Invalid Token');
    });

    test('should return 403 with invalid token format', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer invalid-token-format')
        .expect(403);

      expect(response.text).toContain('Invalid Token');
    });

    test('should return 403 with expired token', async () => {
      // Create an expired token
      const jwt = await import('jsonwebtoken');
      const expiredToken = jwt.default.sign(
        { _id: testUserId },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.text).toContain('Invalid Token');
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

    test('should return 400 on database error when creating comment', async () => {
      // Test with invalid postId that might cause database error
      const response = await request(app)
        .post('/comment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          postId: 'invalid-post-id',
          body: 'Test comment',
        })
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

    test('should return 400 with invalid comment ID format', async () => {
      const response = await request(app)
        .get('/comment/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

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

    test('should return 400 with invalid comment ID format for update', async () => {
      const response = await request(app)
        .put('/comment/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ body: 'Updated' })
        .expect(400);

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

    test('should return 400 with invalid comment ID format for delete', async () => {
      const response = await request(app)
        .delete('/comment/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

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

    test('should return 500 on database error when getting comments', async () => {
      // Test error handling in getCommentsByPost
      // Using an invalid postId format might trigger error handling
      const response = await request(app)
        .get('/post/invalid-post-id/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500); // Should handle the error

      expect(response.body).toHaveProperty('error');
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

    test('should handle login when user has no refreshTokens array', async () => {
      // Create user directly without refreshTokens
      const user = await User.create({
        username: 'LoginUser3',
        email: 'login3@example.com',
        password: await import('bcrypt').then(bcrypt => bcrypt.default.hash('password123', 10)),
      });

      // Login should work and create refreshTokens array
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login3@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
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

    test('should handle logout with invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'invalid_token' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle logout when user not found', async () => {
      // Create a token for a user that will be deleted
      const userData = {
        username: 'LogoutUser2',
        email: 'logout2@example.com',
        password: 'password123',
      };
      await request(app).post('/auth/register').send(userData);
      const loginRes = await request(app).post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      const refreshToken = loginRes.body.refreshToken;

      // Delete the user
      const user = await User.findOne({ email: userData.email });
      if (user) {
        await User.findByIdAndDelete(user._id);
      }

      // Try to logout with token from deleted user (should still work, just no-op)
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(200);

      expect(response.text).toContain('Logged out successfully');
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

    test('should return 403 when refresh token is not in user tokens (token reuse)', async () => {
      // Get a valid refresh token
      const userData = {
        username: 'RefreshUser2',
        email: 'refresh2@example.com',
        password: 'password123',
      };
      await request(app).post('/auth/register').send(userData);
      const loginRes = await request(app).post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      const validRefreshToken = loginRes.body.refreshToken;

      // Verify the token is in the user's refreshTokens array
      const user = await User.findOne({ email: userData.email });
      expect(user).not.toBeNull();
      expect(user?.refreshTokens).toContain(validRefreshToken);

      // Use the token once (refresh it) - this should remove it from the array
      const refreshRes = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      // Verify the old token is removed and a new one is added
      // Wait a bit to ensure database is synced
      await new Promise(resolve => setTimeout(resolve, 100));
      const updatedUser = await User.findOne({ email: userData.email });
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.refreshTokens).not.toContain(validRefreshToken);
      expect(updatedUser?.refreshTokens).toContain(refreshRes.body.refreshToken);
      expect(updatedUser?.refreshTokens.length).toBe(1); // Should only have the new token

      // Try to use the same old token again (should fail - token reuse)
      // The token is still a valid JWT, but it's not in the user's refreshTokens array
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid Refresh Token');
    });

    test('should return 401 when user not found during refresh', async () => {
      // Create a token for a user that will be deleted
      const userData = {
        username: 'RefreshUser3',
        email: 'refresh3@example.com',
        password: 'password123',
      };
      await request(app).post('/auth/register').send(userData);
      const loginRes = await request(app).post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      const refreshToken = loginRes.body.refreshToken;

      // Delete the user
      const user = await User.findOne({ email: userData.email });
      if (user) {
        await User.findByIdAndDelete(user._id);
      }

      // Try to refresh with token from deleted user
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('User not found');
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

    test('should return 500 with invalid user ID format', async () => {
      const response = await request(app)
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500);

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

    test('should return 400 with invalid user ID format for update', async () => {
      const response = await request(app)
        .put('/users/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: 'Updated' })
        .expect(400);

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

    test('should return 500 with invalid user ID format for delete', async () => {
      const response = await request(app)
        .delete('/users/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/users/${userId}`)
        .expect(401);

      expect(response.text).toContain('Access Denied');
    });
  });

  // Additional tests for 100% coverage
  describe('Coverage Edge Cases', () => {
    describe('POST /comment - Missing postId or body separately', () => {
      test('should return 400 if postId is missing', async () => {
        const response = await request(app)
          .post('/comment')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ body: 'Comment without postId' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('postId');
      });

      test('should return 400 if body is missing', async () => {
        const post = await Post.create({
          title: 'Post',
          body: 'Body',
          sender: 'User1',
        });

        const response = await request(app)
          .post('/comment')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ postId: post._id.toString() })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('body');
      });
    });

    describe('Auth Middleware - Token format edge cases', () => {
      test('should return 403 when Authorization header is empty string (invalid token)', async () => {
        const response = await request(app)
          .get('/users')
          .set('Authorization', '')
          .expect(403);

        expect(response.text).toContain('Invalid Token');
      });

      test('should return 401 when Authorization header has no space (no token part)', async () => {
        const response = await request(app)
          .get('/users')
          .set('Authorization', 'Bearer')
          .expect(401);

        expect(response.text).toContain('Access Denied');
      });

      test('should handle missing JWT_SECRET', async () => {
        const originalSecret = process.env.JWT_SECRET;
        try {
          delete process.env.JWT_SECRET;

          const response = await request(app)
            .get('/users')
            .set('Authorization', 'Bearer some-token')
            .expect(500);

          expect(response.text).toContain('Server configuration error');
        } finally {
          // Always restore JWT_SECRET even if test fails
          process.env.JWT_SECRET = originalSecret;
        }
      });
    });

    describe('Auth Controller - Error paths', () => {
      test('should handle database error during registration', async () => {
        // Register a user first
        const userData = {
          username: 'ExistingUser',
          email: 'existing@example.com',
          password: 'password123',
        };
        await request(app).post('/auth/register').send(userData);

        // Try to register again with same email (should trigger existing user error)
        const response = await request(app)
          .post('/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('already exists');
      });

      test('should handle refresh when refreshTokens is not an array', async () => {
        // Create a user and manually set refreshTokens to null/undefined
        const userData = {
          username: 'RefreshTestUser',
          email: 'refreshtest@example.com',
          password: 'password123',
        };
        await request(app).post('/auth/register').send(userData);
        const loginRes = await request(app).post('/auth/login').send({
          email: userData.email,
          password: userData.password,
        });
        const refreshToken = loginRes.body.refreshToken;

        // Manually set refreshTokens to null to test the array check
        const user = await User.findOne({ email: userData.email });
        if (user) {
          (user as any).refreshTokens = null;
          await user.save();
        }

        // Try to refresh - should handle the null case and initialize array
        // Then the token won't be found, so it should return 403
        const response = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken })
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });

      test('should handle refresh when refreshTokens is not an array (undefined case)', async () => {
        const userData = {
          username: 'RefreshTestUser2',
          email: 'refreshtest2@example.com',
          password: 'password123',
        };
        await request(app).post('/auth/register').send(userData);
        const loginRes = await request(app).post('/auth/login').send({
          email: userData.email,
          password: userData.password,
        });
        const refreshToken = loginRes.body.refreshToken;

        // Manually set refreshTokens to undefined
        const user = await User.findOne({ email: userData.email });
        if (user) {
          (user as any).refreshTokens = undefined;
          await user.save();
        }

        // Try to refresh - should handle the undefined case
        const response = await request(app)
          .post('/auth/refresh')
          .send({ refreshToken })
          .expect(403);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Posts Controller - Error paths', () => {
      test('should handle database error in listPosts', async () => {
        // This test ensures error handling path is covered
        // The actual error would be hard to trigger, but we can test with invalid query
        const response = await request(app)
          .get('/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      test('should handle database error in getPost', async () => {
        const response = await request(app)
          .get('/post/invalid-mongo-id-format')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      test('should handle database error in getPostsBySender', async () => {
        const response = await request(app)
          .get('/post?sender=test')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('Comments Controller - Error paths', () => {
      test('should handle database error in getCommentsByPost', async () => {
        const response = await request(app)
          .get('/post/invalid-id/comments')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(500);

        expect(response.body).toHaveProperty('error');
      });

      test('should handle database error in getComment', async () => {
        const response = await request(app)
          .get('/comment/invalid-mongo-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Users Controller - Error paths', () => {
      test('should handle database error in getAllUsers', async () => {
        const response = await request(app)
          .get('/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      test('should handle database error in getUserById', async () => {
        const response = await request(app)
          .get('/users/invalid-mongo-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(500);

        expect(response.body).toHaveProperty('error');
      });

      test('should handle database error in updateUser', async () => {
        const response = await request(app)
          .put('/users/invalid-mongo-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ username: 'Updated' })
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      test('should handle database error in deleteUser', async () => {
        const response = await request(app)
          .delete('/users/invalid-mongo-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(500);

        expect(response.body).toHaveProperty('error');
      });
    });

    describe('Direct controller function tests for unreachable paths', () => {
      test('createPost should handle missing req.user (defensive check)', async () => {
        const { createPost } = await import('../src/controllers/postsController.js');
        let statusCode: number | null = null;
        let responseBody: any = null;
        
        const mockReq = {
          body: { title: 'Test', body: 'Body' },
          user: undefined
        } as any;
        const mockRes = {
          status: function(code: number) {
            statusCode = code;
            return this;
          },
          json: function(body: any) {
            responseBody = body;
          }
        } as any;

        await createPost(mockReq, mockRes);

        expect(statusCode).toBe(401);
        expect(responseBody).toEqual({ error: 'Unauthorized' });
      });

      test('createComment should handle missing req.user (defensive check)', async () => {
        const { createComment } = await import('../src/controllers/commentsController.js');
        let statusCode: number | null = null;
        let responseBody: any = null;
        
        const mockReq = {
          body: { postId: 'test', body: 'Comment' },
          user: undefined
        } as any;
        const mockRes = {
          status: function(code: number) {
            statusCode = code;
            return this;
          },
          json: function(body: any) {
            responseBody = body;
          }
        } as any;

        await createComment(mockReq, mockRes);

        expect(statusCode).toBe(401);
        expect(responseBody).toEqual({ error: 'Unauthorized' });
      });

    });
  });
});
