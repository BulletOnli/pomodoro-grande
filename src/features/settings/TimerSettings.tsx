import { ONE_MINUTE } from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

const WORKING_OPTIONS = [1, 15, 20, 25, 30, 45, 50].map((option) =>
  (option * ONE_MINUTE).toString()
);

const BREAK_OPTIONS = [1, 3, 5, 7, 10].map((option) =>
  (option * ONE_MINUTE).toString()
);

const LONG_BREAK_OPTIONS = [1, 15, 20, 25, 30].map((option) =>
  (option * ONE_MINUTE).toString()
);

const TimerSettings = () => {
  const [workTime, setWorkTime] = useState(WORKING_OPTIONS[2]);
  const [breakTime, setBreakTime] = useState(BREAK_OPTIONS[1]);
  const [isRunning, setIsRunning] = useState(false);
  const [longBreak, setLongBreak] = useState(LONG_BREAK_OPTIONS[1]);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await browser.storage.local.get([
        "breakTime",
        "longBreak",
        "workTime",
      ]);

      setWorkTime(data?.workTime?.toString() ?? WORKING_OPTIONS[2]);
      setBreakTime(data?.breakTime?.toString() ?? BREAK_OPTIONS[1]);
      setLongBreak(data?.longBreak?.toString() ?? LONG_BREAK_OPTIONS[1]);
    };

    loadSettings();

    const updateTimerState = (data: any) => {
      if (data.isRunning !== undefined) setIsRunning(data.isRunning);
    };

    // Initial fetch
    chrome.runtime.sendMessage({ action: "getTimerState" }, updateTimerState);
  }, []);

  const handleWorkTimeChange = (value: string) => {
    setWorkTime(value);

    browser.runtime.sendMessage({
      action: "updateTimerSettings",
      workTime: parseInt(value),
      breakTime: parseInt(breakTime),
      longBreak: parseInt(longBreak),
    });
  };

  const handleBreakTimeChange = (value: string) => {
    setBreakTime(value);

    browser.runtime.sendMessage({
      action: "updateTimerSettings",
      workTime: parseInt(workTime),
      breakTime: parseInt(value),
      longBreak: parseInt(longBreak),
    });
  };

  const handleLongBreakChange = (value: string) => {
    setLongBreak(value);

    browser.runtime.sendMessage({
      action: "updateTimerSettings",
      workTime: parseInt(workTime),
      breakTime: parseInt(breakTime),
      longBreak: parseInt(value),
    });
  };

  return (
    <div className="w-full space-y-2">
      <h1 className="text-base text-center font-semibold mb-2">
        Timer Settings
      </h1>

      <div className="flex items-center justify-between">
        <p>Work</p>

        <Select
          disabled={isRunning}
          value={workTime}
          onValueChange={handleWorkTimeChange}
          defaultValue={workTime}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            {WORKING_OPTIONS.map((option) => {
              const value = Number(option) / ONE_MINUTE;
              return (
                <SelectItem key={option} value={option}>
                  {value} {value > 1 ? "minutes" : "minute"}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p>Short Break</p>

        <Select
          disabled={isRunning}
          value={breakTime}
          onValueChange={handleBreakTimeChange}
          defaultValue={breakTime}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            {BREAK_OPTIONS.map((option) => {
              const value = Number(option) / ONE_MINUTE;
              return (
                <SelectItem key={option} value={option}>
                  {value} {value > 1 ? "minutes" : "minute"}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p>Long Break</p>

        <Select
          disabled={isRunning}
          value={longBreak}
          onValueChange={handleLongBreakChange}
          defaultValue={longBreak}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            {LONG_BREAK_OPTIONS.map((option) => {
              const value = Number(option) / ONE_MINUTE;
              return (
                <SelectItem key={option} value={option}>
                  {value} {value > 1 ? "minutes" : "minute"}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimerSettings;
