import mongoose from "mongoose";

export function connect(connectionString: string): Promise<typeof mongoose> {
    return mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: 5000, // Fail fast for tests (5 seconds)
    });
}

export function disconnect(): Promise<void> {
    return mongoose.disconnect();
}

