import { Volume2 } from "lucide-react";

const VolumeControl = ({ volume, onVolumeChange }) => {
    return (
        <div className="flex items-center space-x-2">
            <Volume2 size={20} />
            <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                className="w-32"
            />
            <span className="text-sm">{volume}%</span>
        </div>
    );
};