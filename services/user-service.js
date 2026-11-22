import { Types } from "mongoose";
import UserModel from "../models/user-model.js";
import ProductModel from "../models/product-model.js";
import * as orderService from "./order-service.js";

const userStatusList = ['active', 'blocked'];

export const createUser = (datas) => {
    return new Promise((resolve, reject) => {
        const { name, email, password, mobile } = datas;
        const user = UserModel({ name, email, password, mobile, status: 'active' });
        user.save()
            .then((data => {
                const { _id: userId, name, email, mobile, wishlist, cart, status } = data;
                resolve({ userId, name, email, mobile, cart, wishlist, status });
            }))
            .catch((err) => {
                reject(user.customError(err));
            });
    })
};
export const updateUser = async (userId, data) => {
    return new Promise(async (resolve, reject) => {
        const { name, mobile, email, password } = data;
        if (!name || !mobile || !email || !password) throw new Error('All fields are mandatory');
        const newPassword = data.newPassword || undefined;
        const user = await UserModel.findById(userId);

        if (user.comparePassword(password)) {
            user.name = name;
            user.mobile = mobile;
            user.email = email;
            user.password = newPassword || password;
            user.save()
                .then((data => {
                    const { name, email, mobile } = data;
                    resolve({ name, email, mobile });
                }))
                .catch((err) => {
                    reject(user.customError(err));
                });
        } else {
            reject(new Error('Incorrect password, please try again'));
        }
    });
};
export const updatePassword = (userId, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!password) throw new Error('Please enter password');
            
            const user = await UserModel.findById(userId);
            user.password = password;
            await user.save();
            resolve({ message: 'Your password updated' });
        } catch (err) {
            reject(err);
        }
    });
};
export const checkMobileAndEmail = async (mobile, email) => {
    if (await UserModel.findOne({ mobile })) return { message: 'User with mobile number is already exist' };
    if (await UserModel.findOne({ email })) return { message: 'User with email address is already exist' };
    return false;
};
export const verifyUser = (enteredEmail, enteredPassword) => {
    return new Promise(async (resolve, reject) => {
        try {
            const user = await UserModel.findOne({ email: enteredEmail });

            if (!user || !user.comparePassword(enteredPassword)) {
                return reject(new Error("Invalid email or password"));
            } else if (user.status == 'blocked') {
                reject(new Error('Your account was blocked by adminp'));
            }
            const { _id: userId, name, email, mobile, cart, wishlist, status } = user;
            resolve({ userId, name, email, mobile, cart, wishlist, status })
        } catch (err) {
            reject(err);
        }
    })
};
export const getUsersBasicData = async (filter = {}) => {
    try {
        const users = await UserModel.find(filter)
            .select('name email mobile status')
            .limit(20);
        return users.map(user => user.toObject());
    } catch (err) {
        return err;
    }
};
export const toggleUserStatus = async (userId) => {
    try {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('Invalid User');
        if (user.status == userStatusList[0]) {
            user.status = userStatusList[1];
        } else {
            user.status = userStatusList[0];
        }
        await user.save();
        return {
            message: `User ${user.name} is now ${user.status}`,
            newStatus: user.status
        }
    } catch (err) {
        throw err;
    }
};
export const findUsersByQuery = async (searchQuery, filter = {}) => {
    try {
        let users = await UserModel.find({
            ...filter,
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { mobile: { $regex: searchQuery, $options: 'i' } },
            ]
        });
        if (!users.length && Types.ObjectId.isValid(searchQuery)) {
            const user = await UserModel.findOne({ _id: searchQuery, ...filter });
            if (user) users = [user];
        }
        return users.map(user => user.toObject());
    } catch (err) {
        return [];
    }
};
export const findUserById = async (userId) => {
    const user = await UserModel.findById(userId);
    return user.toObject();
};
export const checkUserStatus = async (user) => {
    if (!user) return false;
    const userData = await UserModel.findById(user.userId);
    if (!userData) return false;
    if (userData.status != 'active') throw new Error('Your account was blocked by admin');
    const { _id: userId, name, email, mobile, cart, wishlist, wallet: { balance: walletBalance }, status } = userData;
    return { userId, name, email, mobile, cart, wishlist, walletBalance, status };
};
export const getWalletDatas = async (userId) => {
    const wallet = (await UserModel.findById(userId)).toObject().wallet;
    wallet.transactions = wallet.transactions.sort((a, b) => {
        return new Date(b.transactionDate) - new Date(a.transactionDate);
    })
    return wallet;
};
export const addMoneyToWallet = (userId, data) => {
    return new Promise(async (resolve, reject) => {
        const { payment: { razorpay_order_id, razorpay_payment_id, razorpay_signature }, order } = data;
        try {
            if (orderService.verifyPaymentId(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
                const user = await UserModel.findById(userId);
                order.amount /= 100;
                const transaction = await user.wallet.creditAmount(order.amount, 'Transaction was made by you', order.id);
                resolve({ message: 'Amount added to your wallet', transaction });
            } else {
                throw new Error('Payment failed');
            }
        } catch (err) {
            reject(err);
        }
    });
};
export const addNewAddress = async (req) => {
    const userId = req.session.user.userId;
    const { name, mobile, pincode, locality, address, landmark, state } = req.body;
    if (!name && !mobile && !pincode && !locality && !address && !landmark && !state) {
        throw new Error('All fields are required');
    }

    return await UserModel.findByIdAndUpdate(userId, {
        $push: {
            address: { name, mobile, pincode, locality, address, landmark, state }
        }
    });
};
export const updateAddress = async (req) => {
    const userId = req.session.user.userId;
    const addressId = req.params.id;
    const { name, mobile, pincode, locality, address, landmark, state } = req.body;
    if (!name && !mobile && !pincode && !locality && !address && !landmark && !state) {
        throw new Error('All fields are required');
    }
    const user = await UserModel.findById(userId);
    const addressIndex = user.address.findIndex(address => address._id == addressId);
    if (addressIndex != -1) {
        user.address[addressIndex] = { name, mobile, pincode, locality, address, landmark, state };
        return await user.save();
    } else {
        await addNewAddress(req)
    }
};
export const removeAddress = async (userId, addressId) => {
    try {
        addressId = Types.ObjectId.createFromHexString(addressId);
        await UserModel.findByIdAndUpdate(userId, { $pull: { address: { _id: addressId } } });
        return { message: 'Address deleted' };
    } catch (err) {
        if (err.name === 'BSONError') {
            throw new Error('Invalid address');
        } else {
            throw err;
        }
    }
};
export const getAddresses = async (userId) => {
    const addresses = (await UserModel.findById(userId).select('address')).address;
    return addresses.map(address => address.toObject());
};
export const getAddressById = async (userId, addressId) => {
    try {
        const address = (await UserModel.findById(userId))
            .address.find(addr => addr._id.toString() === addressId);
        if (!address) throw new Error('Address not exist');
        return address.toObject();
    } catch (err) {
        throw new Error('Address not exist');
    }
};
export const addToWishlist = (userId, productId) => {
    return new Promise(async (resolve, reject) => {
        try {
            productId = Types.ObjectId.createFromHexString(productId);
            const product = await ProductModel.findById(productId);
            if (!product) throw new Error('Product not found');

            const user = await UserModel.findById(userId);
            if (!user.wishlist.includes(productId)) {
                await user.updateOne({ $push: { wishlist: productId } });
            }
            resolve({ message: 'Product added to the wishlist' });
        } catch (err) {
            if (err.name === 'BSONError') {
                reject(new Error('Product not found'));
            } else {
                reject(err);
            }
        }
    });
};
export const removeFromWishlist = (userId, productId) => {
    return new Promise(async (resolve, reject) => {
        try {
            productId = Types.ObjectId.createFromHexString(productId);
            const user = await UserModel.findById(userId);
            if (user.wishlist.includes(productId)) {
                await user.updateOne({ $pull: { wishlist: productId } });
            }
            resolve({ message: 'Product is removed from the wishlist' });
        } catch (err) {
            if (err.name === 'BSONError') {
                reject(new Error('Product not found'));
            } else {
                reject(err);
            }
        }
    });
};
