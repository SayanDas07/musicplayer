/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */




import { useEffect, useState } from "react";
import { Volume2, SkipBack, SkipForward, PowerOff, Play, Pause, Music2, Mic } from "lucide-react";
import SearchSection from "./SearchSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Problem from "./ProblemButton";

const SpotifyPlayer = () => {
    const [player, setPlayer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [playerReady, setPlayerReady] = useState(false);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [currentTrack, setCurrentTrack] = useState(null);
    const [activeDevice, setActiveDevice] = useState(false);
    const [isPlaybackInitializing, setIsPlaybackInitializing] = useState(false);
    const [progressMs, setProgressMs] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [volume, setVolume] = useState(() => {
        const savedVolume = localStorage.getItem("spotifyVolume");
        return savedVolume ? parseInt(savedVolume) : 50;
    });

    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        if (window.webkitSpeechRecognition) {
            const recognitionInstance = new window.webkitSpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onstart = () => {
                setIsListening(true);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            recognitionInstance.onresult = (event) => {
                const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
                executeVoiceCommand(command);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, []);




    // Format time in mm:ss
    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Update progress every second when playing
    useEffect(() => {
        let intervalId;
        if (isPlaying && !isDragging) {
            intervalId = setInterval(async () => {
                if (player) {
                    const state = await player.getCurrentState();
                    if (state) {
                        setProgressMs(state.position);
                        setDuration(state.duration);
                    }
                }
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [isPlaying, player, isDragging]);

    // Persist state in localStorage
    useEffect(() => {
        if (currentTrack) {
            localStorage.setItem("currentTrack", JSON.stringify(currentTrack));
        }
        localStorage.setItem("isPlaying", JSON.stringify(isPlaying));
        localStorage.setItem("spotifyVolume", volume.toString());
    }, [currentTrack, isPlaying, volume]);

    // Initialize player and setup listeners
    useEffect(() => {
        if (!token) {
            console.error("No Spotify access token found!");
            return;
        }

        let spotifyPlayer = null;

        const initializePlayer = () => {
            if (!window.Spotify) {
                console.error("Spotify SDK not loaded");
                return;
            }

            spotifyPlayer = new window.Spotify.Player({
                name: "My React Web Player",
                getOAuthToken: (cb) => cb(token),
                volume: volume / 100,
            });

            setPlayer(spotifyPlayer);

            spotifyPlayer.addListener("ready", ({ device_id }) => {
                setDeviceId(device_id);
                setPlayerReady(true);
                checkAndTransferPlayback(device_id);
            });

            spotifyPlayer.addListener("not_ready", ({ device_id }) => {
                setPlayerReady(false);
                setActiveDevice(false);
            });

            spotifyPlayer.addListener("player_state_changed", (state) => {
                if (!state) {
                    setIsPlaying(false);
                    setCurrentTrack(null);
                    setActiveDevice(false);
                    setProgressMs(0);
                    setDuration(0);
                    return;
                }
                setIsPlaying(!state.paused);
                setCurrentTrack(state.track_window.current_track);
                setActiveDevice(true);
                setProgressMs(state.position);
                setDuration(state.duration);
            });

            spotifyPlayer.connect();
        };

        if (!window.Spotify) {
            const script = document.createElement("script");
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            script.onload = () => {
                window.onSpotifyWebPlaybackSDKReady = initializePlayer;
            };
            document.body.appendChild(script);
        } else {
            initializePlayer();
        }

        return () => {
            if (spotifyPlayer) {
                spotifyPlayer.disconnect();
            }
        };
    }, [token]);

    const executeVoiceCommand = async (command) => {
        console.log('Voice command received:', command);

       


        // First ensure device is active before executing commands
        if (!activeDevice) {
            try {
                await ensureDeviceIsActive();
            } catch (error) {
                console.error("Error activating device:", error);
                return;
            }
        }

        try {
            if (command.includes('play') || command.includes('start')) {
                if (!isPlaying) {
                    if (player?.resume) {
                        await player.resume();
                    } else {
                        await fetch("https://api.spotify.com/v1/me/player/play", {
                            method: "PUT",
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    }
                    setIsPlaying(true);
                }
            }
            else if (command.includes('pause') || command.includes('stop')) {


                await fetch("https://api.spotify.com/v1/me/player/pause", {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsPlaying(false);

            }
            else if (command.includes('next') || command.includes('skip')) {
                if (player?.nextTrack) {
                    await player.nextTrack();
                } else {
                    await fetch("https://api.spotify.com/v1/me/player/next", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                }
            }
            else if (command.includes('previous') || command.includes('back')) {
                if (player?.previousTrack) {
                    await player.previousTrack();
                } else {
                    await fetch("https://api.spotify.com/v1/me/player/previous", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                }
            }
            else if (command.includes('volume')) {
                if (command.includes('up')) {
                    const newVolume = Math.min(volume + 10, 100);
                    await handleVolumeChange(newVolume);
                } else if (command.includes('down')) {
                    const newVolume = Math.max(volume - 10, 0);
                    await handleVolumeChange(newVolume);
                }
            }
        } catch (error) {
            console.error('Error executing voice command:', error);
        }
    };


    // Toggle voice recognition
    const toggleVoiceRecognition = () => {
        if (!recognition) return;

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    // Add cleanup for voice recognition
    useEffect(() => {
        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, [recognition]);

    const transferPlaybackToDevice = async (deviceId, shouldPlay = false) => {
        try {
            const response = await fetch("https://api.spotify.com/v1/me/player", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    device_ids: [deviceId],
                    play: shouldPlay,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to transfer playback: ${response.status}`);
            }

            setActiveDevice(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error("Error transferring playback:", error);
        }
    };

    const checkAndTransferPlayback = async (deviceId) => {
        try {
            const response = await fetch("https://api.spotify.com/v1/me/player", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) return;

            const data = await response.json();
            const shouldStartPlaying = data && data.is_playing;
            await transferPlaybackToDevice(deviceId, shouldStartPlaying);
        } catch (error) {
            console.error("Error checking playback state:", error);
        }
    };

    const ensureDeviceIsActive = async () => {
        if (!deviceId) return false;

        try {
            const response = await fetch("https://api.spotify.com/v1/me/player", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) return false;

            const data = await response.json();
            if (!data?.device?.id || data.device.id !== deviceId) {
                await transferPlaybackToDevice(deviceId, true);
            }

            setActiveDevice(true);
            return true;
        } catch (error) {
            console.error("Error ensuring device is active:", error);
            return false;
        }
    };

    const handlePlayTrack = async (trackUri, contextUri) => {
        if (!playerReady || !deviceId) return;

        setIsPlaybackInitializing(true);
        try {
            const isDeviceActive = await ensureDeviceIsActive();
            if (!isDeviceActive) return;

            await fetch("https://api.spotify.com/v1/me/player/play", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    context_uri: contextUri,
                    offset: { uri: trackUri }
                }),
            });

            setIsPlaying(true);
        } catch (error) {
            console.error("Error playing track:", error);
        } finally {
            setIsPlaybackInitializing(false);
        }
    };

    const handlePlayPause = async () => {
        if (!player || !playerReady) return;

        try {
            if (!activeDevice) {
                await transferPlaybackToDevice(deviceId, true);
            }

            const state = await player.getCurrentState();
            if (!state) return;

            const endpoint = state.paused ?
                "https://api.spotify.com/v1/me/player/play" :
                "https://api.spotify.com/v1/me/player/pause";

            await fetch(endpoint, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });

            setIsPlaying(!state.paused);
        } catch (error) {
            console.error("Error handling play/pause:", error);
        }
    };

    const handleSkipNext = async () => {
        if (isPlaybackInitializing || !activeDevice) return;

        try {
            await fetch("https://api.spotify.com/v1/me/player/next", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (error) {
            console.error("Error skipping to next track:", error);
        }
    };

    const handleSkipPrevious = async () => {
        if (isPlaybackInitializing || !activeDevice) return;

        try {
            await fetch("https://api.spotify.com/v1/me/player/previous", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (error) {
            console.error("Error skipping to previous track:", error);
        }
    };

    const handleVolumeChange = async (newVolume) => {
        if (!activeDevice) return;

        try {
            await fetch(
                `https://api.spotify.com/v1/me/player/volume?volume_percent=${newVolume}`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setVolume(newVolume);
            if (player) {
                player.setVolume(newVolume / 100);
            }
        } catch (error) {
            console.error("Error changing volume:", error);
        }
    };

    const handleSeek = async (newPosition) => {
        if (!player || !activeDevice) return;

        try {
            await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${newPosition}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
            });
            setProgressMs(newPosition);
        } catch (error) {
            console.error("Error seeking:", error);
        }
    };

    const handleDisconnect = async () => {
        try {
            if (player) {
                player.disconnect();
            }
            setPlayerReady(false);
            setActiveDevice(false);
            setCurrentTrack(null);
            setIsPlaying(false);
        } catch (error) {
            console.error("Error disconnecting:", error);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-800">
                <div className="p-6 space-y-6">
                    <div className="flex justify-end">
                        <button
                            onClick={toggleVoiceRecognition}
                            className={`p-2 rounded-full transition-all duration-200 ${isListening
                                ? "bg-green-500 text-white"
                                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                                }`}
                            title={isListening ? "Voice Control Active" : "Enable Voice Control"}
                        >
                            <Mic size={20} className={isListening ? "animate-pulse" : ""} />
                        </button>
                    </div>
                    {/* Player Status Alerts */}
                    {!playerReady && (
                        <Alert className="rounded-xl bg-blue-900/50 border-blue-800">
                            <AlertDescription className="text-blue-200 flex items-center">
                                <Music2 className="w-5 h-5 mr-2 animate-pulse" />
                                Connecting to Spotify...
                            </AlertDescription>
                        </Alert>
                    )}

                    {!activeDevice && playerReady && (
                        <Alert className="rounded-xl bg-yellow-900/50 border-yellow-800">
                            <AlertDescription className="text-yellow-200">
                                Click Play to activate this device
                            </AlertDescription>
                        </Alert>
                    )}

                    {isPlaybackInitializing && (
                        <Alert className="rounded-xl bg-green-900/50 border-green-800">
                            <AlertDescription className="text-green-200">
                                Initializing playback...
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Now Playing Section */}
                    {currentTrack && (
                        <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                            <img
                                src={currentTrack.album?.images[1]?.url || "/api/placeholder/64/64"}
                                alt={currentTrack.album?.name}
                                className="w-16 h-16 rounded-lg shadow-md"
                            />
                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-100">{currentTrack.name}</h3>
                                <p className="text-sm text-gray-400">
                                    {currentTrack.artists[0].name}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {currentTrack && (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-400 w-12 text-right">
                                    {formatTime(progressMs)}
                                </span>
                                <div className="relative flex-grow h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="absolute w-full">
                                        <input
                                            type="range"
                                            min="0"
                                            max={duration}
                                            value={progressMs}
                                            onChange={(e) => {
                                                setProgressMs(parseInt(e.target.value));
                                                setIsDragging(true);
                                            }}
                                            onMouseDown={() => setIsDragging(true)}
                                            onMouseUp={(e) => {
                                                setIsDragging(false);
                                                handleSeek(parseInt(e.target.value));
                                            }}
                                            onTouchStart={() => setIsDragging(true)}
                                            onTouchEnd={(e) => {
                                                setIsDragging(false);
                                                handleSeek(parseInt(e.target.value));
                                            }}
                                            className="w-full h-2 absolute top-0 left-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-100"
                                        style={{ width: `${(progressMs / duration) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400 w-12">
                                    {formatTime(duration)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Playback Controls */}
                    <div className="flex justify-center items-center space-x-6">
                        <button
                            onClick={handleSkipPrevious}
                            disabled={!activeDevice || isPlaybackInitializing}
                            className={`p-3 rounded-full transition-all duration-200 ${activeDevice && !isPlaybackInitializing
                                ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100"
                                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                                }`}
                        >
                            <SkipBack size={24} />
                        </button>

                        <button
                            onClick={handlePlayPause}
                            disabled={!playerReady || isPlaybackInitializing}
                            className={`p-4 rounded-full transition-all duration-200 ${playerReady && !isPlaybackInitializing
                                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
                                : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            {isPlaying ? (
                                <Pause size={28} />
                            ) : (
                                <Play size={28} className="ml-1" />
                            )}
                        </button>

                        <button
                            onClick={handleSkipNext}
                            disabled={!activeDevice || isPlaybackInitializing}
                            className={`p-3 rounded-full transition-all duration-200 ${activeDevice && !isPlaybackInitializing
                                ? "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-gray-100"
                                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                                }`}
                        >
                            <SkipForward size={24} />
                        </button>

                        <button
                            onClick={handleDisconnect}
                            disabled={!playerReady}
                            className={`p-3 rounded-full transition-all duration-200 ${playerReady
                                ? "bg-red-900/50 hover:bg-red-800 text-red-400 hover:text-red-300"
                                : "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                                }`}
                            title="Disconnect from Spotify"
                        >
                            <PowerOff size={24} />
                        </button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center space-x-4 px-4 py-3 bg-gray-800/50 rounded-xl">
                        <Volume2 size={20} className="text-gray-400" />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                            className="flex-grow h-2 rounded-full appearance-none bg-gray-700 cursor-pointer accent-green-500"
                        />
                        <span className="text-sm font-medium text-gray-400 min-w-[3ch]">
                            {volume}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Search Section */}
            <div className="mt-6">
                <SearchSection token={token} onPlayTrack={handlePlayTrack} />
            </div>

            <div>
                <Problem />
            </div>
        </div>
    );
};

export default SpotifyPlayer;


