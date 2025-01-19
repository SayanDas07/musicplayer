import React from 'react';
import { AlertCircle } from 'lucide-react';

const Problem = () => {
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("authCode");
        localStorage.removeItem("currentTrack");
        localStorage.removeItem("isPlaying");
        localStorage.removeItem("spotifyVolume");
        window.location.reload();
    };

    return (
        <div className="mt-6 flex flex-col items-center space-y-3">
            <p className="text-blue-800 text-xl flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                Having trouble? Click below and login again
            </p>
            <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-800 text-red-300 
                 rounded-xl transition-all duration-200 border border-red-800/50 
                 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
                Restart
            </button>
        </div>
    );
};

export default Problem;









