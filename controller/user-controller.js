import UserModel from "../model/user-model.js";

const userHelper = {
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
    getUser: (enteredEmail, enteredPassword) => {
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
    }
}

export default userHelper;