import mongoose from 'mongoose';
import { connect, disconnect } from '../src/db.js';
import { createApp } from '../src/app.js';

describe('MongoDB Connection', () => {
  const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/posts-app-test';

  afterEach(async () => {
    // Clean up: disconnect after each test
    // Wait a bit for any pending operations to complete
    if (mongoose.connection.readyState !== 0) {
      try {
        await disconnect();
      } catch (error) {
        // Ignore errors during cleanup (connection might already be closed)
      }
    }
    // Reset mongoose connection state
    mongoose.connection.removeAllListeners();
  });

  test('should connect to MongoDB successfully', async () => {
    await expect(connect(TEST_MONGODB_URI)).resolves.not.toThrow();
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  test('should disconnect from MongoDB successfully', async () => {
    await connect(TEST_MONGODB_URI);
    await expect(disconnect()).resolves.not.toThrow();
    expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
  });

  test('should fail to connect with invalid URI', async () => {
    const invalidUri = 'mongodb://invalid-host:27017/test';
    // Increase timeout for this test since connection failure takes time
    await expect(connect(invalidUri)).rejects.toThrow();
  }, 10000); // 10 second timeout

  test('should handle multiple connection attempts gracefully', async () => {
    // Disconnect first to ensure clean state
    if (mongoose.connection.readyState !== 0) {
      await disconnect();
    }
    
    // First connection
    await connect(TEST_MONGODB_URI);
    const firstConnectionState = mongoose.connection.readyState;
    expect(firstConnectionState).toBe(1); // Connected
    
    // Try to connect again with the same URI
    // Mongoose will reuse the existing connection if URI matches exactly
    // This should resolve immediately without error
    await expect(connect(TEST_MONGODB_URI)).resolves.not.toThrow();
    const secondConnectionState = mongoose.connection.readyState;
    
    expect(secondConnectionState).toBe(1); // Still connected
    
    await disconnect();
  });

  test('createApp should return a Promise that waits for MongoDB connection', async () => {
    // Ensure we start with a disconnected state
    if (mongoose.connection.readyState !== 0) {
      await disconnect();
      // Wait a bit for disconnect to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verify createApp returns a Promise
    const appPromise = createApp(TEST_MONGODB_URI);
    expect(appPromise).toBeInstanceOf(Promise);

    // Wait for the Promise to resolve
    const app = await appPromise;

    // Verify MongoDB is connected
    // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
    // After createApp resolves, connection should be established (state 1)
    expect(mongoose.connection.readyState).toBe(1);

    // Verify app is an Express app (has use method)
    expect(app).toHaveProperty('use');
    expect(typeof app.use).toBe('function');

    await disconnect();
  });

  test('createApp should reject Promise if MongoDB connection fails', async () => {
    // Ensure we start with a disconnected state
    if (mongoose.connection.readyState !== 0) {
      await disconnect();
    }

    const invalidUri = 'mongodb://invalid-host:27017/test';
    
    // Increase timeout for this test since connection failure takes time
    await expect(createApp(invalidUri)).rejects.toThrow();
  }, 10000); // 10 second timeout
});

