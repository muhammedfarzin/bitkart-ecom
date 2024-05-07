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


export default router;