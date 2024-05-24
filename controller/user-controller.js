import UserModel from "../models/user-model.js";

const userStatusList = ['active', 'blocked'];

const userController = {
    createUser: (datas) => {
        return new Promise((resolve, reject) => {
            const { name, email, password, mobile } = datas;
            const user = UserModel({ name, email, password, mobile, status: 'active' });
            user.save()
                .then((data => {
                    const { _id: userId, name, email, mobile, cart, status } = data;
                    resolve({ userId, name, email, mobile, cart, status });
                }))
                .catch((err) => {
                    reject(user.customError(err));
                });
        })
    },
    checkMobileAndEmail: async (mobile, email) => {
        if (await UserModel.findOne({ mobile })) return { message: 'User with mobile number is already exist' };
        if (await UserModel.findOne({ email })) return { message: 'User with email address is already exist' };
        return false;
    },
    verifyUser: (enteredEmail, enteredPassword) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await UserModel.findOne({ email: enteredEmail });

                if (!user || !user.comparePassword(enteredPassword)) {
                    return reject(new Error("Invalid email or password"));
                } else if (user.status == 'blocked') {
                    reject(new Error('The user was blocked by admin'));
                }
                const { _id: userId, name, email, mobile, cart, status } = user;
                resolve({ userId, name, email, mobile, cart, status })
            } catch (err) {
                reject(err);
            }
        })
    },
    getUsersBasicData: async () => {
        try {
            const users = await UserModel.find()
                .select('name email mobile status')
                .limit(20);
            return users.map(user => user.toObject());
        } catch (err) {
            return err;
        }
    },
    blockUser: async (userId) => {
        try {
            const newData = await UserModel.findByIdAndUpdate(userId, { status: userStatusList[1] });
            return { message: `User ${newData.name} is blocked` }
        } catch (err) {
            throw new Error('Invalid user');
        }
    },
    unBlockUser: async (userId) => {
        try {
            const newData = await UserModel.findByIdAndUpdate(userId, { status: userStatusList[0] });
            return { message: `User ${newData.name} is now active` }
        } catch (err) {
            throw new Error('Invalid user');
        }
    },
    findUsersByQuery: async (searchQuery) => {
        try {
            let users = await UserModel.find({
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { email: { $regex: searchQuery, $options: 'i' } },
                    { mobile: { $regex: searchQuery, $options: 'i' } },
                ]
            });
            if (!users.length) users = [await UserModel.findById(searchQuery)];
            return users.map(user => user.toObject());
        } catch (err) {
            return [];
        }
    },
    checkUserStatus: async (user) => {
        if (!user) return false;
        const userData = await UserModel.findById(user.userId);
        if (!userData) return false;
        if (userData.status != 'active') return false;
        return true;
    },
    addNewAddress: async (req) => {
        const userId = req.session.user.userId;
        const { name, mobile, pincode, locality, address, landmark, state } = req.body;
        if (!name && !mobile && !pincode && !locality && !address && !landmark && state) {
            throw new Error('All fields are required');
        }

        return await UserModel.findByIdAndUpdate(userId, {
            $push: {
                address: { name, mobile, pincode, locality, address, landmark, state }
            }
        });
    },
    getAddresses: async (userId) => {
        const addresses = (await UserModel.findById(userId).select('address')).address;
        return addresses.map(address => address.toObject());
    },
    getAddressById: async (userId, addressId) => {
        try {
            const address = (await UserModel.findById(userId))
                .address.find(addr => addr._id.toString() === addressId);
            if (!address) throw new Error('Address not exist');
            console.log(address)
            return address.toObject();
        } catch (err) {
            throw new Error('Address not exist');
        }
    },
    updateAddress: async (req) => {
        const userId = req.session.user.userId;
        const addressId = req.params.id;
        const { name, mobile, pincode, locality, address, landmark, state } = req.body;
        if (!name && !mobile && !pincode && !locality && !address && !landmark && state) {
            throw new Error('All fields are required');
        }
        const user = await UserModel.findById(userId);
        const addressIndex = user.address.findIndex(address => address._id == addressId);
        if (addressIndex != -1) {
            user.address[addressIndex] = { name, mobile, pincode, locality, address, landmark, state };
            return await user.save();
        } else {
            await userController.addNewAddress(req)
        }
    }
}

export default userController;