import { useEffect, useState } from 'react';
import { FaSpotify } from 'react-icons/fa';
import { BsArrowRightCircle } from 'react-icons/bs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import axios from 'axios';
import SpotifyPlayer from './Spotify1';

const Login = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if code is in URL query
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code') || localStorage.getItem('authCode');
    
    if (codeFromUrl) {
      setCode(codeFromUrl);
      localStorage.setItem('authCode', codeFromUrl);
      exchangeCodeForToken(codeFromUrl);
      
      // Remove the code from URL without triggering a refresh
      const newUrl = window.location.pathname;
      window.history.pushState({}, '', newUrl);
    }
  }, []);

  const exchangeCodeForToken = async (code) => {
    setLoading(true);
    try {
      const response = await axios.post('https://musicplayer-5ecj.onrender.com/spotify/callback', { code }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        setAccessToken(response.data.access_token);
        localStorage.setItem('token', response.data.access_token);
        console.log('Access Token:', response.data.access_token);
        // Refresh the page after successful token exchange
        window.location.reload();
      } else {
        console.error('Error obtaining access token');
      }
    } catch (error) {
      console.error('Error exchanging code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const response = await axios.get('https://musicplayer-5ecj.onrender.com/spotify/login');
    if (response.data && response.data.data.authUrl) {
      window.location.href = response.data.data.authUrl;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-full">
              <FaSpotify className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                Spotify Login
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Connect to your music universe
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          {(!accessToken || !code) ? (
            <div className="flex flex-col items-center space-y-6">
              <Button
                onClick={handleLogin}
                className="w-full bg-green-500 hover:bg-green-600 text-white transition-all duration-300 transform hover:scale-105 py-6 text-lg font-medium"
              >
                <div className="flex items-center justify-center gap-3">
                  <FaSpotify className="w-6 h-6" />
                  Login with Spotify
                  <BsArrowRightCircle className="w-5 h-5 ml-2" />
                </div>
              </Button>
              <div className="text-center space-y-2">
                <p className="text-gray-600">
                  Get ready for your personalized music experience
                </p>
                <p className="text-sm text-gray-500">
                  Secure authorization required
                </p>
              </div>
            </div>
          ) : (
            <div>
              {loading ? (
                <p>Loading your Spotify player...</p>
              ) : (
                <div>
                  <p>Successfully authenticated! You can now access Spotify features.</p>
                  <SpotifyPlayer />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;