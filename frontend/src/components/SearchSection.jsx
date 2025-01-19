import { useEffect, useState } from "react";
import { Search, Loader2, Music2, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SearchSection = ({ token, onPlayTrack }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [debouncedTerm, setDebouncedTerm] = useState("");

    const handleSearchTermChange = (e) => {
        const newTerm = e.target.value;
        setSearchTerm(newTerm);
        if (!newTerm.trim()) {
            setSearchResults([]);
            setError(null);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (debouncedTerm) handleSearch();
    }, [debouncedTerm]);

    const handleSearch = async () => {
        if (!debouncedTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(debouncedTerm)}&type=track&limit=10`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    response.status === 401 
                        ? 'Session expired. Please login again.' 
                        : 'Failed to search tracks. Please try again.'
                );
            }

            const data = await response.json();
            setSearchResults(data.tracks.items);
        } catch (error) {
            setError(error.message);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const renderTrackItem = (track) => (
        <div
            key={track.id}
            onClick={() => onPlayTrack(track.uri, track.album.uri)}
            className="flex items-center p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent hover:border-gray-200 hover:shadow-sm"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onPlayTrack(track.uri, track.album.uri)}
            aria-label={`Play ${track.name} by ${track.artists.map(a => a.name).join(", ")}`}
        >
            <div className="relative">
                <img
                    src={track.album.images[2]?.url || "/api/placeholder/64/64"}
                    alt={track.album.name}
                    className="w-16 h-16 rounded-lg shadow-md mr-4 group-hover:brightness-90 transition-all duration-200"
                    loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black bg-opacity-40 rounded-lg p-2">
                        <Play className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-white mb-1 group-hover:text-green-600 transition-colors duration-200"> {/* Changed text color to white */}
                    {track.name}
                </p>
                <p className="text-sm text-gray-400">
                    {track.artists.map(a => a.name).join(", ")}
                </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0 translate-x-2">
                <Music2 className="w-5 h-5 text-green-500" />
            </div>
        </div>
    );
    

    return (
        <div className="max-w-3xl mx-auto p-6 bg-gray-900 rounded-2xl shadow-lg"> {/* Changed bg-white to bg-gray-900 */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-gray-400 w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        placeholder="Search for songs..."
                        className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-lg bg-gray-800 text-white"
                        aria-label="Search for songs"
                    />
                    {isSearching && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6 rounded-xl">
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-3">
                {searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {searchResults.map(renderTrackItem)}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        {searchTerm ? (
                            isSearching ? (
                                <p className="text-gray-500 text-lg">Searching for "{searchTerm}"...</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-gray-600 text-lg font-medium">No songs found</p>
                                    <p className="text-gray-400">Try a different search term</p>
                                </div>
                            )
                        ) : (
                            <div className="space-y-2">
                                <Search className="w-12 h-12 text-gray-300 mx-auto" />
                                <p className="text-gray-400 text-lg">Start typing to search for songs</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchSection;
