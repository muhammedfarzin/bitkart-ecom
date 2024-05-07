import { Router } from "express";

const router = Router();

router.get('/login', (req, res) => {
    res.render('user/login');
})

router.get('/signup', (req, res) => {
    res.render('user/signup');
})

router.get('/', (req, res) => {
    res.render('user/index');
})

router.get('/view/:id', (req, res) => {
    res.render('user/products/products');
})


export default router;