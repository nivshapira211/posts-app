import mongoose from "mongoose";

export function connect(connectionString) {
    return mongoose.connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
}

export function disconnect() {
    return mongoose.disconnect();
}