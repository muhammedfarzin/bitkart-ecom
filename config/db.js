import mongoose from "mongoose";

export const mongoUri = 'mongodb://localhost:27017/bitkart';

export default async function connect() {
    try {
        await mongoose.connect(mongoUri)
        console.log("Database connected");
    } catch (e) {
        console.log(e.message);
    }
}