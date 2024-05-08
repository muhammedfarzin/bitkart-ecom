import mongoose from "mongoose";

const mongoUrl = 'mongodb://localhost:27017/bitkart';

export default async function connect() {
    try {
        await mongoose.connect(mongoUrl)
        console.log("Database connected");
    } catch (e) {
        console.log(e.message);
    }
}