import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import debounce from "@/utils/debounce";
import TodoProgress from "../todos/TodoProgress";

const PomodoroTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);

  useEffect(() => {
    const updateTimerState = (data: any) => {
      if (data.time !== undefined) setTime(data.time);
      if (data.isRunning !== undefined) setIsRunning(data.isRunning);
      if (data.isBreak !== undefined) setIsBreak(data.isBreak);
      if (data.isLongBreak !== undefined) setIsLongBreak(data.isLongBreak);
    };

    chrome.runtime.sendMessage({ action: "getTimerState" }, updateTimerState);

    const messageListener = (message: any) => {
      if (message.action === "getTimerState") {
        updateTimerState(message);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const startTimer = () => {
    chrome.runtime.sendMessage({ action: "startTimer" });
  };

  const stopTimer = () => {
    chrome.runtime.sendMessage({ action: "stopTimer" });
  };

  const skipTimer = debounce(() => {
    chrome.runtime.sendMessage({ action: "skipTimer" });
  }, 1000);

  return (
    <TabsContent
      value="timer"
      className="flex flex-col items-center justify-center gap-6"
    >
      <div className="text-center space-y-2 mt-6">
        <p
          className={`${
            isBreak ? "text-red-500" : "text-primary-custom"
          } text-5xl font-bold `}
        >
          {time > 0 ? new Date(time).toISOString().slice(14, 19) : "00:00"}
        </p>
        <h1
          className={`${
            isBreak ? "text-red-500" : "text-primary-custom"
          } text-xl text-center font-semibold mb-2`}
        >
          {!isRunning && !isBreak && "Ready? Start! 🚀"}
          {isRunning && !isBreak && "Focus time! ⚡"}
          {isRunning && isBreak && !isLongBreak && "Quick break! ☀️"}
          {isRunning && isBreak && isLongBreak && "Long Break! ✨"}
        </h1>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-2">
        {isRunning ? (
          <>
            <Button
              size="sm"
              variant="destructive"
              className="min-w-28 bg-red-100 text-red-600 border  hover:bg-red-100/80"
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
          </>
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

      {isRunning && <TodoProgress />}
    </TabsContent>
  );
};

export default PomodoroTimer;
