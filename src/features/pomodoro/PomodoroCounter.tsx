import { useEffect, useState } from "react";

const PomodoroCounter = () => {
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);

  useEffect(() => {
    const syncState = async () => {
      const result = await chrome.storage.session.get("pomodoroCount");
      setPomodoroCount((result?.pomodoroCount as number) ?? 0);
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
    <div className="flex flex-col items-center justify-center">
      <p className="text-2xl font-extrabold text-primary-custom">
        {pomodoroCount}
      </p>
      <p className="font-semibold text-sm">Pomodoro</p>
    </div>
  );
};

export default PomodoroCounter;
