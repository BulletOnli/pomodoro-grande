import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

interface ContextType {
  isRunning: boolean;
  setIsRunning: (value: boolean) => void;

  isPaused: boolean;
  setIsPaused: (value: boolean) => void;

  isBreak: boolean;
  setIsBreak: (value: boolean) => void;

  isLongBreak: boolean;
  setIsLongBreak: (value: boolean) => void;

  ultraFocusMode: boolean;
  setUltraFocusMode: (value: boolean) => void;
}

const TimerContext = createContext<ContextType | undefined>(undefined);

export const TimerContextProvider = ({ children }: { children: ReactNode }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [ultraFocusMode, setUltraFocusMode] = useState(false);

  useEffect(() => {
    const syncState = async () => {
      const result = await chrome.storage.local.get([
        "isRunning",
        "isBreak",
        "isPaused",
        "isLongBreak",
        "ultraFocusMode",
      ]);

      setIsRunning((result.isRunning as boolean) ?? false);
      setIsPaused((result.isPaused as boolean) ?? false);
      setIsBreak((result.isBreak as boolean) ?? false);
      setIsLongBreak((result.isLongBreak as boolean) ?? false);
      setUltraFocusMode((result.ultraFocusMode as boolean) ?? false);
    };

    syncState();
  }, []);

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        setIsRunning,
        isPaused,
        setIsPaused,
        isBreak,
        setIsBreak,
        isLongBreak,
        setIsLongBreak,
        ultraFocusMode,
        setUltraFocusMode,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useMyContext must be used within a TimerContextProvider");
  }
  return context;
};
