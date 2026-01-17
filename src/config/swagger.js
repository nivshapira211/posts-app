import swaggerJsdoc from 'swagger-jsdoc';

const options = {
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
      },
    },
    tags: [
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
  apis: ['./src/routes/*.js'], // Path to the API files (relative to project root)
};

export const swaggerSpec = swaggerJsdoc(options);

