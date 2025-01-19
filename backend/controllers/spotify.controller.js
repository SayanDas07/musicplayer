import queryString from 'querystring';
import axios from 'axios';

export const handleCallback = async (req, res) => {
    const { code } = req.body;
    const url = 'https://accounts.spotify.com/api/token';

    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')
    };

    const data = queryString.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDIRECT_URI,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
    });

    try {
        const response = await axios.post(url, data, { headers });

        res.json({ success: true, ...response.data });
    } catch (error) {
        console.error("Error exchanging code for token", error.response?.data || error.message);
        res.status(500).json({ error: 'Error exchanging code for token' });
    }
};

export const handleLogin = async (req, res) => {
    const scope = 'user-read-playback-state user-read-private user-read-email user-library-read playlist-read-private user-modify-playback-state streaming';
    try {
        const authUrl = `https://accounts.spotify.com/authorize?` +
            queryString.stringify({
                response_type: 'code',
                client_id: process.env.CLIENT_ID,
                scope: scope,
                redirect_uri: process.env.REDIRECT_URI,
                state: Math.random().toString(36).substring(7),
            });

     
        res.json({ data: { authUrl } });
    } catch (error) {
        console.error("Error redirecting to Spotify", error.response?.data || error.message);
        res.status(500).json({ error: 'Error redirecting to Spotify' });
    }
};