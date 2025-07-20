import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import debounce from "@/utils/debounce";
import TodoProgress from "../todos/TodoProgress";
import { ONE_HOUR } from "@/constants";
import { useTimer } from "@/context/TimerContext";
import LeaveAReviewPopup from "@/components/LeaveAReviewPopup";
import { Pause, Play } from "lucide-react";
import PomodoroCounter from "./PomodoroCounter";
import FocusSpentCounter from "./FocusSpentCounter";

const PomodoroTimer = () => {
  const [time, setTime] = useState(0);
  const {
    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    isBreak,
    isLongBreak,
    setIsBreak,
    setIsLongBreak,
    setUltraFocusMode,
    ultraFocusMode,
  } = useTimer();

  useEffect(() => {
    const syncState = async () => {
      const result = await chrome.storage.local.get(["time"]);
      setTime((result.time as number) ?? 0);
    };

    syncState();

    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      Object.entries(changes).forEach(([key, { newValue }]) => {
        if (key === "time") setTime(newValue ?? 0);
        if (key === "isRunning") setIsRunning(newValue ?? false);
        if (key === "isPaused") setIsPaused(newValue ?? false);
        if (key === "isBreak") setIsBreak(newValue ?? false);
        if (key === "isLongBreak") setIsLongBreak(newValue ?? false);
        if (key === "ultraFocusMode") setUltraFocusMode(newValue ?? false);
      });
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const startTimer = () => {
    chrome.runtime.sendMessage({ type: "start-timer" });
  };

  const pauseTimer = () => {
    if (isPaused) {
      chrome.runtime.sendMessage({ type: "start-timer" });
    } else {
      chrome.runtime.sendMessage({ type: "pause-timer" });
    }
  };

  const stopTimer = () => {
    chrome.runtime.sendMessage({ type: "stop-timer" });
  };

  const skipTimer = debounce(() => {
    chrome.runtime.sendMessage({ type: "skip-timer" });
  }, 1000);

  const formatTimer = (time: number) => {
    if (time <= 0) return "00:00";

    const sliceStart = time >= ONE_HOUR ? 11 : 14;

    return new Date(time).toISOString().slice(sliceStart, 19);
  };

  const generateTimerText = () => {
    if (isPaused) return "Timeout! ⏱️";

    if (!isRunning && !isBreak) return "Ready? Start! 🚀";
    if (isRunning && !isBreak) return "Focus time! ⚡";
    if (isRunning && isBreak && !isLongBreak) return "Quick break! ☀️";
    if (isRunning && isBreak && isLongBreak) return "Long Break! ✨";
    return "";
  };

  return (
    <TabsContent
      value="timer"
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="text-center space-y-2 mt-6">
        {ultraFocusMode && (
          <p className="absolute top-14 left-1/2 -translate-x-1/2 text-[10px] px-4 bg-primary-custom text-white rounded-full">
            Ultra Focus Mode! 🔥
          </p>
        )}
        <p
          className={`${
            isBreak ? "text-red-500" : "text-primary-custom"
          } text-5xl font-bold `}
        >
          {formatTimer(time)}
        </p>
        <h1
          className={`${
            isBreak ? "text-red-500" : "text-primary-custom"
          } text-xl text-center font-semibold mb-2`}
        >
          {generateTimerText()}
        </h1>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-2">
        {isRunning ? (
          <div className="flex flex-col gap-2 items-center justify-center">
            <Button
              size="sm"
              className="min-w-28 bg-primary-custom hover:bg-primary-custom/80 text-white hover:text-white"
              onClick={pauseTimer}
            >
              {isPaused ? (
                <>
                  <Play />
                  Resume
                </>
              ) : (
                <>
                  <Pause />
                  Pause
                </>
              )}
            </Button>

            <div className="flex items-center gap-1 mx-auto">
              <Button
                size="sm"
                variant="destructive"
                className="min-w-28 bg-red-500 text-white"
                onClick={stopTimer}
              >
                Stop
              </Button>

              {isBreak && (
                <Button
                  size="sm"
                  variant="outline"
                  className="min-w-28 bg-primary-custom hover:bg-primary-custom/80 text-white hover:text-white"
                  onClick={skipTimer}
                >
                  Skip
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            className="min-w-28 bg-primary-custom hover:bg-primary-custom/90"
            onClick={startTimer}
          >
            Start
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-col items-center justify-center gap-2 text-primary-custom">
        <TodoProgress />

        <div className="w-44 h-px bg-primary-custom"></div>

        <div className="w-full flex items-center justify-evenly gap-6  ">
          <PomodoroCounter />

          <div className="w-px h-12 bg-primary-custom"></div>

          <FocusSpentCounter />
        </div>

        <p className="text-[10px] font-medium">
          This updates everytime the time runs out
        </p>
      </div>
    </TabsContent>
  );
};

export default PomodoroTimer;
