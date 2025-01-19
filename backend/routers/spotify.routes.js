import express from 'express';
import { handleCallback, handleLogin } from '../controllers/spotify.controller.js';


const router = express.Router();

router.get('/login', handleLogin);

router.post('/callback', handleCallback);

export default router;