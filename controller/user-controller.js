import UserModel from "../model/user-model.js";

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
    }
}

export default userController;