import fs from "fs"
import ProductModel from "../model/product-model.js";

const productController = {
    addProduct: (datas) => {
        return new Promise((resolve, reject) => {
            const { title, description, price, offerPrice, category, quantity } = datas.body;
            const imagePaths = datas.files.map(image => image.path.replace('public', ''));
            const product = new ProductModel({ title, description, price, offerPrice, category, quantity, imagePaths });
            product.save()
                .then(data => {
                    resolve(data);
                })
                .catch(err => {
                    imagePaths.forEach(imagePath => {
                        fs.unlink('public' + imagePath, (err) => {
                            if (err) {
                                console.log('Image is not deleted: ' + err.message);
                            }
                        });
                    });
                    if (err.errors) {
                        reject(product.invalidDataCustomError(err));
                    } else {
                        reject(err);
                    }
                })
        })
    },
    getProducts: async () => {
        const products = await ProductModel.find().limit(20);
        return products.map(product => product.toObject());
    }
}

export default productController;