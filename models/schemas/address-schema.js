import { Schema } from "mongoose";

const addressSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    locality: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    landmark: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    }
});


export default addressSchema;