import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Posts App API',
      version: '1.0.0',
      description: 'API documentation for the Posts and Comments application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Post: {
          type: 'object',
          required: ['title', 'sender'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the post',
              example: '6960eb69acd0a11fddf3a61e',
            },
            title: {
              type: 'string',
              description: 'Title of the post',
              example: 'My First Post',
            },
            body: {
              type: 'string',
              description: 'Body content of the post',
              example: 'This is the content of my post',
            },
            sender: {
              type: 'string',
              description: 'Name of the post sender',
              example: 'Niv',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the post was created',
              example: '2024-01-15T10:30:00.000Z',
            },
          },
        },
        Comment: {
          type: 'object',
          required: ['postId', 'sender', 'body'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the comment',
              example: '6960f391acd0a11fddf3a651',
            },
            postId: {
              type: 'string',
              description: 'ID of the post this comment belongs to',
              example: '6960eb69acd0a11fddf3a61e',
            },
            sender: {
              type: 'string',
              description: 'Name of the comment sender',
              example: 'Yoav',
            },
            body: {
              type: 'string',
              description: 'Body content of the comment',
              example: 'This is a great post!',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time when the comment was created',
              example: '2024-01-15T11:00:00.000Z',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Post not found',
            },
          },
        },
        CreatePostRequest: {
          type: 'object',
          required: ['title', 'sender'],
          properties: {
            title: {
              type: 'string',
              description: 'Title of the post',
              example: 'My First Post',
            },
            body: {
              type: 'string',
              description: 'Body content of the post',
              example: 'This is the content of my post',
            },
            sender: {
              type: 'string',
              description: 'Name of the post sender',
              example: 'Niv',
            },
          },
        },
        UpdatePostRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the post',
              example: 'Updated Title',
            },
            body: {
              type: 'string',
              description: 'Body content of the post',
              example: 'Updated body content',
            },
            sender: {
              type: 'string',
              description: 'Name of the post sender',
              example: 'Niv',
            },
          },
        },
        CreateCommentRequest: {
          type: 'object',
          required: ['postId', 'sender', 'body'],
          properties: {
            postId: {
              type: 'string',
              description: 'ID of the post this comment belongs to',
              example: '6960eb69acd0a11fddf3a61e',
            },
            sender: {
              type: 'string',
              description: 'Name of the comment sender',
              example: 'Yoav',
            },
            body: {
              type: 'string',
              description: 'Body content of the comment',
              example: 'This is a great post!',
            },
          },
        },
        UpdateCommentRequest: {
          type: 'object',
          properties: {
            body: {
              type: 'string',
              description: 'Body content of the comment',
              example: 'Updated comment text',
            },
            sender: {
              type: 'string',
              description: 'Name of the comment sender',
              example: 'Alice',
            },
          },
        },
        DeleteCommentResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'Comment deleted successfully',
            },
          },
        },
        User: {
          type: 'object',
          required: ['username', 'email'],
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the user',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'securePassword123',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'securePassword123',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        RefreshResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'New JWT access token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              description: 'New JWT refresh token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        LogoutRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token to invalidate',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password',
              example: 'securePassword123',
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Username',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password (will be hashed)',
              example: 'newSecurePassword123',
            },
          },
        },
        DeleteUserResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
              example: 'User deleted successfully',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint',
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints (requires authentication)',
      },
      {
        name: 'Posts',
        description: 'Post management endpoints',
      },
      {
        name: 'Comments',
        description: 'Comment management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API files (relative to project root)
};

export const swaggerSpec = swaggerJsdoc(options);

