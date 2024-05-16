import { Schema, model } from "mongoose";

const categorySchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
    },
    imagePath: {
        type: String,
        required: true
    }
})

const CategoryModel = model('category', categorySchema, 'categories');

export default CategoryModel;   