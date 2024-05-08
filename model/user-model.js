import { Schema, model } from "mongoose"
import bcrypt from "bcrypt";

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
})

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        type: [String]
    },
    address: {
        type: [addressSchema]
    },
    wishlist: {
        type: [String]
    },
    orders: {
        type: [String]
    },
    status: {
        type: String,
        required: true
    }
})

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        this.password = await bcrypt.hash(this.password, 10)
    }

    next();
})

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.customError = function (err) {
    if (err.code === 11000 && err.keyPattern.email) {
        return new Error("This email address is already in use.");
    } else if (err.code === 11000 && err.keyPattern.mobile) {
        return new Error("This mobile number is already in use.");
    } else {
        return err;
    }
}

const userModel = model('user', userSchema, 'users')

export default userModel;