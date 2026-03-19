import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

const PomodoroCounter = () => {
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);

  const handleReset = () => {
    chrome.runtime.sendMessage({ type: "reset-pomodoro-count" });
    setPomodoroCount(0);
  };

  useEffect(() => {
    const syncState = async () => {
      const result = await chrome.storage.session.get([
        "pomodoroCount",
        "lastPomodoroDate",
      ]);

      const today = new Date().toDateString();
      if (result.lastPomodoroDate && result.lastPomodoroDate !== today) {
        setPomodoroCount(0);
      } else {
        setPomodoroCount((result?.pomodoroCount as number) ?? 0);
      }
    };

    syncState();

    const handleStorageChange = (changes: any) => {
      if (changes.pomodoroCount)
        setPomodoroCount(changes.pomodoroCount.newValue);
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center relative group">
      <p className="text-2xl font-extrabold text-primary-custom">
        {pomodoroCount}
      </p>
      <p className="font-semibold text-sm">Pomodoro</p>
      <button
        onClick={handleReset}
        title="Reset Pomodoro count"
        className="absolute top-0 right-0 translate-x-full text-zinc-400 hover:text-primary-custom transition-colors opacity-0 group-hover:opacity-100 p-1"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};

export default PomodoroCounter;
