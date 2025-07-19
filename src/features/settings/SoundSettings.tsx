import { useState, useEffect, useRef, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import debounce from "@/utils/debounce";
import sounds from "@/constants/sounds";

const SoundSettings = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState(sounds[0].value);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleEnableSound = (value: boolean) => {
    setIsSoundEnabled(value);
    chrome.storage.local.set({ isSoundEnabled: value });

    // Pause the audio if sound is disabled
    if (!value && audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleSoundChange = (value: string) => {
    setIsSoundPlaying(true);
    setSelectedSound(value);
    chrome.storage.local.set({ selectedSound: value });
  };

  const handlePlay = () => {
    setIsSoundPlaying(false);
    const sound = new Audio(selectedSound);
    sound.volume = soundVolume;
    sound.play();

    audioRef.current = sound;
    setIsSoundPlaying(true);
  };

  const handleStop = () => {
    setIsSoundPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const debouncedSave = useCallback(
    debounce((value: number) => {
      chrome.storage.local.set({ soundVolume: value });
    }, 500),
    []
  );

  const handleVolumeChange = (value: number) => {
    setSoundVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }

    debouncedSave(value);
  };

  useEffect(() => {
    chrome.storage.local
      .get(["selectedSound", "isSoundEnabled", "soundVolume"])
      .then((data) => {
        setSelectedSound((data?.selectedSound as string) ?? sounds[0].value);
        setIsSoundEnabled((data?.isSoundEnabled as boolean) ?? true);
        setSoundVolume((data?.soundVolume as number) ?? 0.5);
      });
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      handleStop();
    }

    if (isSoundEnabled && isSoundPlaying) {
      handlePlay();
    }

    return () => {
      if (audioRef.current) handleStop();
    };
  }, [selectedSound, soundVolume, isSoundPlaying]);

  return (
    <div className="w-full space-y-2">
      {/* <h1 className="text-base text-center font-semibold ">Sound Settings</h1> */}

      <div className="flex items-center justify-between">
        <p>Enable Sound</p>
        <Switch
          className={`data-[state=checked]:bg-primary-custom`}
          checked={isSoundEnabled}
          onCheckedChange={handleEnableSound}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <p>Select Sound</p>
        <Select
          value={selectedSound}
          onValueChange={handleSoundChange}
          disabled={!isSoundEnabled}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Select a sound" />
          </SelectTrigger>
          <SelectContent>
            {sounds.map((sound) => (
              <SelectItem key={sound.value} value={sound.value}>
                {sound.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p>Volume</p>
        <div className="flex items-center gap-2">
          <input
            value={soundVolume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            type="range"
            min="0"
            max="1"
            step="0.1"
            className="accent-primary-custom"
          />
          <p className="text-xs w-5">{soundVolume * 100}</p>
        </div>
      </div>
    </div>
  );
};

export default SoundSettings;
