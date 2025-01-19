import express from 'express';
import cors from 'cors';
import axios from 'axios';
import queryString from 'querystring';
import dotenv from 'dotenv';

dotenv.config({
    path: './.env'
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors(
    {
        origin: 'https://musicplayer-gamma-rosy.vercel.app/',
        credentials: true
    }
));
app.use(express.json());

import spotifyRouter from './routers/spotify.routes.js';
app.use('/spotify', spotifyRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
