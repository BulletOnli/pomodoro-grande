import {
  BREAK_OPTIONS,
  LONG_BREAK_OPTIONS,
  ONE_HOUR,
  ONE_MINUTE,
  ULTRA_FOCUS_MODE_OPTIONS,
  WORKING_OPTIONS,
} from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

const DEFAULT_WORK_TIME = WORKING_OPTIONS[3];
const DEFAULT_BREAK_TIME = BREAK_OPTIONS[1];
const DEFAULT_LONG_BREAK_TIME = LONG_BREAK_OPTIONS[1];

const TimerSettings = () => {
  const [time, setTime] = useState(DEFAULT_WORK_TIME);
  const [breakTime, setBreakTime] = useState(DEFAULT_BREAK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [longBreak, setLongBreak] = useState(DEFAULT_LONG_BREAK_TIME);
  const [ultraFocusMode, setUltraFocusMode] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await browser.storage.local.get([
        "breakTime",
        "isRunning",
        "longBreak",
        "workTime",
        "ultraFocusMode",
      ]);

      setTime(data?.workTime?.toString() ?? DEFAULT_WORK_TIME);
      setBreakTime(data?.breakTime?.toString() ?? DEFAULT_BREAK_TIME);
      setIsRunning((data.isRunning as boolean) ?? false);
      setLongBreak(data?.longBreak?.toString() ?? DEFAULT_LONG_BREAK_TIME);
      setUltraFocusMode((data?.ultraFocusMode as boolean) ?? false);
    };

    loadSettings();
  }, []);

  const handleWorkTimeChange = (value: string) => {
    setTime(value);
    browser.storage.local.set({
      time: parseInt(value),
      workTime: parseInt(value),
    });
  };

  const handleBreakTimeChange = (value: string) => {
    setBreakTime(value);
    browser.storage.local.set({ breakTime: parseInt(value) });
  };

  const handleLongBreakChange = (value: string) => {
    setLongBreak(value);
    browser.storage.local.set({ longBreak: parseInt(value) });
  };

  const handleUltraFocusMode = (value: boolean) => {
    setUltraFocusMode(value);
    if (value) {
      browser.storage.local.set({ ultraFocusMode: value });
    } else {
      setTime(DEFAULT_WORK_TIME);
      browser.storage.local.set({
        ultraFocusMode: value,
        time: parseInt(DEFAULT_WORK_TIME),
        workTime: parseInt(DEFAULT_WORK_TIME),
      });
    }
  };

  const formatSelectTime = (value: number) => {
    if (value >= ONE_HOUR) {
      value = value / ONE_HOUR;
      return `${value} ${value > 1 ? "hours" : "hour"}`;
    } else {
      value = value / ONE_MINUTE;
      return `${value} ${value > 1 ? "minutes" : "minute"}`;
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* <h1 className="text-base text-center font-semibold mb-2">
        Timer Settings
      </h1> */}

      <div className="flex items-center justify-between">
        <p>Work</p>

        <Select
          disabled={isRunning || ultraFocusMode}
          value={time}
          onValueChange={handleWorkTimeChange}
          defaultValue={time}
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
          disabled={isRunning || ultraFocusMode}
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
        <div className="flex items-center gap-2">
          <p>Long Break</p>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <CircleHelp className="text-primary-custom size-4" />
              </TooltipTrigger>
              <TooltipContent className="w-[200px] bg-primary-custom text-center">
                <p>Long break is taken after 4 work sessions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Select
          disabled={isRunning || ultraFocusMode}
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

      <div className="flex items-center gap-2">
        <div className="w-full h-px bg-border"></div>
        <div className="text-zinc-400 text-xs text-nowrap">
          Advanced Settings
        </div>
        <div className="w-full h-px bg-border"></div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p>Ultra Focus Mode</p>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <CircleHelp className="text-primary-custom size-4" />
              </TooltipTrigger>
              <TooltipContent className="w-[200px] bg-primary-custom text-center">
                <p>Maintain uninterrupted focus for a longer time.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          className={`data-[state=checked]:bg-primary-custom`}
          checked={ultraFocusMode}
          onCheckedChange={handleUltraFocusMode}
          disabled={isRunning}
        />
      </div>

      {ultraFocusMode && (
        <div className="flex items-center justify-between">
          <p>Focus for:</p>

          <Select
            disabled={!ultraFocusMode || isRunning}
            value={time}
            onValueChange={handleWorkTimeChange}
            defaultValue={time}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              {ULTRA_FOCUS_MODE_OPTIONS.map((option) => {
                const value = Number(option) / ONE_MINUTE;
                return (
                  <SelectItem key={option} value={option}>
                    {formatSelectTime(Number(option))}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default TimerSettings;
