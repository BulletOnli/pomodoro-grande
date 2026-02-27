import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import debounce from "@/utils/debounce";
import TodoProgress from "../todos/TodoProgress";
import {
  BREAK_OPTIONS,
  LONG_BREAK_OPTIONS,
  ONE_HOUR,
  ONE_MINUTE,
  WORKING_OPTIONS,
} from "@/constants";
import { useTimer } from "@/context/TimerContext";
import { Pause, Play } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CustomSelectInput } from "@/components/ui/select-input";
import PomodoroCounter from "./PomodoroCounter";
import FocusSpentCounter from "./FocusSpentCounter";

const PomodoroTimer = () => {
  const [time, setTime] = useState(0);
  const [workTime, setWorkTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [longBreak, setLongBreak] = useState(0);
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
      const result = await chrome.storage.local.get([
        "time",
        "workTime",
        "breakTime",
        "longBreak",
      ]);
      setTime((result.time as number) ?? 0);
      setWorkTime((result.workTime as number) ?? parseInt(WORKING_OPTIONS[3]));
      setBreakTime((result.breakTime as number) ?? parseInt(BREAK_OPTIONS[1]));
      setLongBreak(
        (result.longBreak as number) ?? parseInt(LONG_BREAK_OPTIONS[1]),
      );
    };

    syncState();

    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      Object.entries(changes).forEach(([key, { newValue }]) => {
        if (key === "time") setTime(newValue ?? 0);
        if (key === "workTime") setWorkTime(newValue ?? 0);
        if (key === "breakTime") setBreakTime(newValue ?? 0);
        if (key === "longBreak") setLongBreak(newValue ?? 0);
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

  const handleWorkTimeChange = (value: string) => {
    const valInt = parseInt(value);
    setWorkTime(valInt);

    const updates: any = { workTime: valInt };
    if (!isBreak) {
      updates.time = valInt;
      setTime(valInt);
    }
    chrome.storage.local.set(updates);
  };

  const handleBreakTimeChange = (value: string) => {
    const valInt = parseInt(value);
    setBreakTime(valInt);

    const updates: any = { breakTime: valInt };
    if (isBreak && !isLongBreak) {
      updates.time = valInt;
      setTime(valInt);
    }
    chrome.storage.local.set(updates);
  };

  const handleLongBreakChange = (value: string) => {
    const valInt = parseInt(value);
    setLongBreak(valInt);

    const updates: any = { longBreak: valInt };
    if (isBreak && isLongBreak) {
      updates.time = valInt;
      setTime(valInt);
    }
    chrome.storage.local.set(updates);
  };

  return (
    <TabsContent
      value="timer"
      className="flex h-full py-4 flex-col items-center justify-center gap-4"
    >
      <div className="flex w-full flex-col items-center justify-center gap-2 relative">
        {ultraFocusMode && (
          <p className="text-[10px] px-4 bg-primary-custom text-white rounded-full">
            Ultra Focus Mode! 🔥
          </p>
        )}

        {/* Work Timer */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            !isBreak ? "scale-100 opacity-100" : "scale-80 opacity-50"
          }`}
        >
          <p className="text-sm font-medium mb-1 truncate text-foreground/70">
            Work
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <button
                disabled={isRunning || ultraFocusMode}
                className={`transition-opacity font-bold ${
                  !isBreak
                    ? "text-5xl text-primary-custom"
                    : "text-3xl hover:opacity-80 disabled:opacity-50"
                }`}
              >
                {formatTimer(!isBreak ? time : workTime)}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 flex flex-col gap-3">
              <p className="text-sm font-medium">Edit Work Time</p>
              <CustomSelectInput
                disabled={isRunning || ultraFocusMode}
                value={workTime.toString()}
                onValueChange={handleWorkTimeChange}
                options={WORKING_OPTIONS.map((option) => ({
                  value: option,
                  label: `${Number(option) / ONE_MINUTE} ${
                    Number(option) / ONE_MINUTE > 1 ? "minutes" : "minute"
                  }`,
                }))}
                placeholder="Select time"
                className="w-[180px] h-8"
                max={
                  Number(WORKING_OPTIONS[WORKING_OPTIONS.length - 1]) /
                  ONE_MINUTE
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Break Timer */}
        <div
          className={`flex flex-col items-center transition-all duration-300 ${
            isBreak ? "scale-100 opacity-100" : "scale-80 opacity-50"
          }`}
        >
          <p className="text-sm font-medium mb-1 truncate text-foreground/70">
            {isLongBreak ? "Long Break" : "Break"}
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <button
                disabled={isRunning || ultraFocusMode}
                className={`transition-opacity font-bold ${
                  isBreak
                    ? "text-5xl text-red-500"
                    : "text-3xl hover:opacity-80 disabled:opacity-50"
                }`}
              >
                {formatTimer(
                  isBreak ? time : isLongBreak ? longBreak : breakTime,
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 flex flex-col gap-3">
              <p className="text-sm font-medium">
                Edit {isLongBreak ? "Long Break" : "Break"} Time
              </p>
              <CustomSelectInput
                disabled={isRunning || ultraFocusMode}
                value={
                  isLongBreak ? longBreak.toString() : breakTime.toString()
                }
                onValueChange={
                  isLongBreak ? handleLongBreakChange : handleBreakTimeChange
                }
                options={(isLongBreak ? LONG_BREAK_OPTIONS : BREAK_OPTIONS).map(
                  (option) => ({
                    value: option,
                    label: `${Number(option) / ONE_MINUTE} ${
                      Number(option) / ONE_MINUTE > 1 ? "minutes" : "minute"
                    }`,
                  }),
                )}
                placeholder="Select time"
                className="w-[180px] h-8"
                max={
                  Number(
                    (isLongBreak ? LONG_BREAK_OPTIONS : BREAK_OPTIONS)[
                      (isLongBreak ? LONG_BREAK_OPTIONS : BREAK_OPTIONS)
                        .length - 1
                    ],
                  ) / ONE_MINUTE
                }
              />
            </PopoverContent>
          </Popover>
        </div>
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

      <div className="w-full space-y-1 mt-auto">
        <div className="w-full bg-secondary/40 border border-border/50 rounded-xl p-2 transition-colors hover:bg-secondary/60">
          <TodoProgress />
        </div>

        <div className="flex items-stretch justify-between gap-1 w-full">
          <div className="flex-1 bg-secondary/40 border border-border/50 rounded-xl p-2 flex items-center justify-center transition-colors hover:bg-secondary/60">
            <PomodoroCounter />
          </div>
          <div className="flex-1 bg-secondary/40 border border-border/50 rounded-xl p-2 flex items-center justify-center transition-colors hover:bg-secondary/60">
            <FocusSpentCounter />
          </div>
        </div>
        <p className="text-center text-[10px] font-medium">
          This updates everytime the time runs out
        </p>
      </div>
    </TabsContent>
  );
};

export default PomodoroTimer;
