import express, { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import routes from "./routes/index.js";
import { connect } from "./db.js";

export function createApp(mongodbUri: string): Promise<Express> {
  return new Promise(async (resolve, reject) => {
    try {
      // Wait for MongoDB connection before creating the app
      await connect(mongodbUri);
      
      const app = express();

      app.use(express.json());
      
      // Swagger documentation
      app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      
      app.use(routes);

      resolve(app);
    } catch (error) {
      reject(error);
    }
  });
}

