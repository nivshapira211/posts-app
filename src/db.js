import mongoose from "mongoose";

export function connect(connectionString) {
    return mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // Fail fast for tests (5 seconds)
    });
}

export function disconnect() {
    return mongoose.disconnect();
}