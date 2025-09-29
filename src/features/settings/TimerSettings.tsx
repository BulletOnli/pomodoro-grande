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
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useTimer } from "@/context/TimerContext";
import { CustomSelectInput } from "@/components/ui/select-input";

const DEFAULT_WORK_TIME = WORKING_OPTIONS[3];
const DEFAULT_BREAK_TIME = BREAK_OPTIONS[1];
const DEFAULT_LONG_BREAK_TIME = LONG_BREAK_OPTIONS[1];

const TimerSettings = () => {
  const [time, setTime] = useState(DEFAULT_WORK_TIME);
  const [breakTime, setBreakTime] = useState(DEFAULT_BREAK_TIME);
  const [longBreak, setLongBreak] = useState(DEFAULT_LONG_BREAK_TIME);
  const { isRunning, ultraFocusMode, setUltraFocusMode } = useTimer();
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await chrome.storage.local.get([
        "breakTime",
        "longBreak",
        "workTime",
        "isAutoStartEnabled",
      ]);

      setTime(data?.workTime?.toString() ?? DEFAULT_WORK_TIME);
      setBreakTime(data?.breakTime?.toString() ?? DEFAULT_BREAK_TIME);
      setLongBreak(data?.longBreak?.toString() ?? DEFAULT_LONG_BREAK_TIME);
      setIsAutoStartEnabled(data?.isAutoStartEnabled ?? false);
    };

    loadSettings();
  }, []);

  const handleWorkTimeChange = (value: string) => {
    setTime(value);
    chrome.storage.local.set({
      time: parseInt(value),
      workTime: parseInt(value),
    });
  };

  const handleBreakTimeChange = (value: string) => {
    setBreakTime(value);
    chrome.storage.local.set({ breakTime: parseInt(value) });
  };

  const handleLongBreakChange = (value: string) => {
    setLongBreak(value);
    chrome.storage.local.set({ longBreak: parseInt(value) });
  };

  const handleUltraFocusMode = (value: boolean) => {
    setUltraFocusMode(value);
    if (value) {
      chrome.storage.local.set({ ultraFocusMode: value });
    } else {
      setTime(DEFAULT_WORK_TIME);
      chrome.storage.local.set({
        ultraFocusMode: value,
        time: parseInt(DEFAULT_WORK_TIME),
        workTime: parseInt(DEFAULT_WORK_TIME),
      });
    }
  };

  const handleAutoStartChange = (value: boolean) => {
    setIsAutoStartEnabled(value);
    chrome.storage.local.set({ isAutoStartEnabled: value });
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
      <div className="flex items-center justify-between">
        <p>Work</p>
        <CustomSelectInput
          disabled={isRunning || ultraFocusMode}
          value={time}
          onValueChange={handleWorkTimeChange}
          options={WORKING_OPTIONS.map((option) => ({
            value: option,
            label: `${Number(option) / ONE_MINUTE} ${
              Number(option) / ONE_MINUTE > 1 ? "minutes" : "minute"
            }`,
          }))}
          placeholder="Select time"
          className="w-[180px] h-8"
          max={Number(WORKING_OPTIONS[WORKING_OPTIONS.length - 1]) / ONE_MINUTE}
        />
      </div>

      <div className="flex items-center justify-between">
        <p>Short Break</p>
        <CustomSelectInput
          disabled={isRunning || ultraFocusMode}
          value={breakTime}
          onValueChange={handleBreakTimeChange}
          options={BREAK_OPTIONS.map((option) => ({
            value: option,
            label: `${Number(option) / ONE_MINUTE} ${
              Number(option) / ONE_MINUTE > 1 ? "minutes" : "minute"
            }`,
          }))}
          placeholder="Select time"
          className="w-[180px] h-8"
          max={Number(BREAK_OPTIONS[BREAK_OPTIONS.length - 1]) / ONE_MINUTE}
        />
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

        <CustomSelectInput
          disabled={isRunning || ultraFocusMode}
          value={longBreak}
          onValueChange={handleLongBreakChange}
          options={LONG_BREAK_OPTIONS.map((option) => ({
            value: option,
            label: `${Number(option) / ONE_MINUTE} ${
              Number(option) / ONE_MINUTE > 1 ? "minutes" : "minute"
            }`,
          }))}
          placeholder="Select time"
          className="w-[180px] h-8"
          max={
            Number(LONG_BREAK_OPTIONS[LONG_BREAK_OPTIONS.length - 1]) /
            ONE_MINUTE
          }
        />
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p>Auto Start</p>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger>
                <CircleHelp className="text-primary-custom size-4" />
              </TooltipTrigger>
              <TooltipContent className="w-[200px] bg-primary-custom text-center">
                <p>Automatically start the timer on browser startup.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Switch
          className={`data-[state=checked]:bg-primary-custom`}
          checked={isAutoStartEnabled}
          onCheckedChange={handleAutoStartChange}
        />
      </div>
    </div>
  );
};

export default TimerSettings;
