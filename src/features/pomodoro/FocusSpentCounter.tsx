import { ONE_HOUR, ONE_MINUTE } from "@/constants";
import { useEffect, useState, useMemo, useCallback } from "react";

interface TimeDisplay {
  value: number;
  unit: string;
  remainingMinutes?: number;
}

const FocusSpentCounter = () => {
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);
  const [workTime, setWorkTime] = useState<number>(0);

  const useChromeStorage = useCallback(() => {
    const syncState = async () => {
      try {
        const [sessionResult, localResult] = await Promise.all([
          chrome.storage.session.get("pomodoroCount"),
          chrome.storage.local.get("workTime"),
        ]);

        setPomodoroCount(sessionResult?.pomodoroCount ?? 0);
        setWorkTime(localResult?.workTime ?? 0);
      } catch (error) {
        console.error("Failed to sync storage state:", error);
      }
    };

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>
    ) => {
      if (changes.workTime?.newValue !== undefined) {
        setWorkTime(changes.workTime.newValue);
      }
      if (changes.pomodoroCount?.newValue !== undefined) {
        setPomodoroCount(changes.pomodoroCount.newValue);
      }
    };

    return { syncState, handleStorageChange };
  }, []);

  useEffect(() => {
    const { syncState, handleStorageChange } = useChromeStorage();

    syncState();
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [useChromeStorage]);

  const timeCalculations = useMemo(() => {
    const pomoDurationMinutes = workTime / ONE_MINUTE;
    const totalMinutes = pomodoroCount * pomoDurationMinutes;
    const totalMilliseconds = totalMinutes * ONE_MINUTE;
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.floor(totalMinutes % 60);
    const totalSeconds = Math.floor((totalMilliseconds % ONE_MINUTE) / 1000);

    return {
      totalMinutes: Math.floor(totalMinutes),
      totalMilliseconds,
      totalHours,
      remainingMinutes,
      totalSeconds,
    };
  }, [pomodoroCount, workTime]);

  const pluralize = (
    count: number,
    singular: string,
    plural?: string
  ): string => {
    return count === 1 ? singular : plural || `${singular}s`;
  };

  const formatTime = (): TimeDisplay => {
    const {
      totalMilliseconds,
      totalMinutes,
      totalHours,
      remainingMinutes,
      totalSeconds,
    } = timeCalculations;

    if (totalMilliseconds < ONE_MINUTE) {
      return {
        value: totalSeconds,
        unit: pluralize(totalSeconds, "sec"),
      };
    }

    if (totalMilliseconds < ONE_HOUR) {
      return {
        value: totalMinutes,
        unit: pluralize(totalMinutes, "min"),
      };
    }

    return {
      value: totalHours,
      unit: pluralize(totalHours, "hr"),
      remainingMinutes: remainingMinutes > 0 ? remainingMinutes : undefined,
    };
  };

  const renderTimeUnit = (value: number, unit: string) => (
    <>
      {value}
      <span className="text-xs font-semibold">&nbsp;{unit}</span>
    </>
  );

  const renderTime = () => {
    const { value, unit, remainingMinutes } = formatTime();

    return (
      <>
        {renderTimeUnit(value, unit)}
        {remainingMinutes && (
          <>
            &nbsp;
            {renderTimeUnit(
              remainingMinutes,
              pluralize(remainingMinutes, "min")
            )}
          </>
        )}
      </>
    );
  };

  return (
    <div className="min-w-[80px] flex flex-col items-center justify-center">
      <p className="text-3xl font-extrabold">{renderTime()}</p>
      <p className="font-semibold">Focus</p>
    </div>
  );
};

export default FocusSpentCounter;
