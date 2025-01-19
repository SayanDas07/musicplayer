const TrackInfo = ({ currentTrack, activeDevice, playerReady, isPlaybackInitializing }) => {
    return (
        <div>
            {currentTrack && (
                <div className="text-sm">
                    <p>Now Playing: {currentTrack.name}</p>
                    <p>Artist: {currentTrack.artists[0].name}</p>
                </div>
            )}

            {!activeDevice && playerReady && (
                <p className="text-yellow-500">
                    Click Play to activate this device
                </p>
            )}

            {!playerReady && (
                <p className="text-red-500">
                    Connecting to Spotify...
                </p>
            )}

            {isPlaybackInitializing && (
                <p className="text-yellow-500">
                    Initializing playback...
                </p>
            )}
        </div>
    );
};