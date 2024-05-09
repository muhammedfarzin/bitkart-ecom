import CategoryModel from "../model/category-model.js";

const categoryController = {
    createCategory: (datas) => {
        return new Promise((resolve, reject) => {
            const imagePath = datas.file.path.replace('public', '');
            const { title, description } = datas.body;
            if (!title && !description) {
                return reject(new Error('Please enter title and description'));
            }

            const category = new CategoryModel({ title, description, imagePath });
            category.save()
                .then(data => resolve(data))
                .catch(err => reject(err));
        })
    },
    getCategories: () => {
        return CategoryModel.find()
            .limit(20)
            .then(datas => datas);
    }
};

export default categoryController;