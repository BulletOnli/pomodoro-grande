import backgroundMusics from "./constants/background-musics";
import sounds from "./constants/sounds";
import { PomodoroHistory, StorageChanges, Todo } from "./types";
import { updateBadge } from "./utils/badgeExtension";
import { createNotification } from "./utils/notification";
import { blockAllSites, unBlockAllSites } from "./utils/sites";

let WORK_TIME = 1000 * 60 * 25;
let BREAK_TIME = 1000 * 60 * 5;
let LONG_BREAK_TIME = 1000 * 60 * 15;
let BLOCKED_SITES: string[] = [
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "x.com",
  "youtube.com",
  "reddit.com",
  "netflix.com",
  "tiktok.com",
];

let isRunning = false;
let isBreak = false;
let ultraFocusMode = false;
let isPaused = false;
let isAutoStartEnabled = false;

let interval: NodeJS.Timeout | undefined;
let time = WORK_TIME;
let pomodoroCount = 0; // 1 Work = 1 Pomodoro

let selectedSound = sounds[0].value;
let isSoundEnabled = true;
let soundVolume = 0.5;

let selectedMusic = backgroundMusics[0].value;
let isMusicEnabled = true;
let musicVolume = 0.5;

let isNotificationEnabled = true;

let completedTodos: Todo[] = [];
let todosStateAtStart: Todo[] = [];

const updateVariables = (changes: StorageChanges): void => {
  if (changes.time !== undefined) time = changes.time;
  if (changes.workTime) WORK_TIME = changes.workTime;
  if (changes.breakTime) BREAK_TIME = changes.breakTime;
  if (changes.longBreak) LONG_BREAK_TIME = changes.longBreak;

  if (changes.selectedSound) selectedSound = changes.selectedSound;
  if (changes.soundVolume !== undefined) soundVolume = changes.soundVolume;

  if (changes.isRunning !== undefined) isRunning = changes.isRunning;
  if (changes.isPaused !== undefined) isPaused = changes.isPaused;
  if (changes.isSoundEnabled !== undefined) {
    isSoundEnabled = changes.isSoundEnabled;
  }
  if (changes.isNotificationEnabled !== undefined) {
    isNotificationEnabled = changes.isNotificationEnabled;
  }
  if (changes.ultraFocusMode !== undefined) {
    ultraFocusMode = changes.ultraFocusMode;
  }
  if (changes.isAutoStartEnabled !== undefined) {
    isAutoStartEnabled = changes.isAutoStartEnabled;
  }

  // Music settings
  if (changes.selectedMusic) selectedMusic = changes.selectedMusic;
  if (changes.isMusicEnabled !== undefined) {
    isMusicEnabled = changes.isMusicEnabled;
  }
  if (changes.musicVolume !== undefined) musicVolume = changes.musicVolume;
};

chrome.storage.local.get(
  [
    "time",
    "workTime",
    "isRunning",
    "isPaused",
    "isAutoStartEnabled",
    "breakTime",
    "selectedSound",
    "isSoundEnabled",
    "soundVolume",
    "longBreak",
    "isNotificationEnabled",
    "ultraFocusMode",
    "selectedMusic",
    "isMusicEnabled",
    "musicVolume",
  ],
  (result) => updateVariables(result as StorageChanges)
);

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["isAutoStartEnabled"], async (result) => {
    isAutoStartEnabled = result.isAutoStartEnabled ?? false;

    if (isAutoStartEnabled) {
      startTimer().catch(console.error);
      await playMusic();
    } else {
      stopTimer();
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#40A662" });
  updateBadge(time);
  chrome.storage.local.set({
    time,
    workTime: WORK_TIME,
    breakTime: BREAK_TIME,
    longBreak: LONG_BREAK_TIME,
    blockedSites: BLOCKED_SITES,
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "start-timer") {
    startTimer().catch(console.error);
  }

  if (message.type === "pause-timer") {
    pauseTimer().catch(console.error);
  }

  if (message.type === "stop-timer") {
    stopTimer().catch(console.error);
  }

  if (message.type === "skip-timer") {
    skipTimer();
  }
});

chrome.storage.onChanged.addListener((changes) => {
  const newChanges: StorageChanges = Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [key, value.newValue])
  );
  updateVariables(newChanges);

  // If the user completes a todo while the timer is running
  if (changes.todos && newChanges.todos && isRunning) {
    const newlyCompletedTodos = newChanges.todos.filter((todo: Todo) => {
      const todoAtStart = todosStateAtStart.find((t) => t.id === todo.id);

      return todo.isCompleted && (!todoAtStart || !todoAtStart.isCompleted);
    });

    completedTodos = newlyCompletedTodos;
  }

  if ((changes.blockedSites || changes.allowedUrls) && isRunning) {
    blockAllSites();
  }

  if (changes.workTime) {
    updateBadge(WORK_TIME);
  }
});

const skipTimer = () => {
  chrome.storage.local.set({ time: 0 });

  if (isPaused) {
    startTimer().catch(console.error);
  }
};

const pauseTimer = async (): Promise<void> => {
  clearInterval(interval);
  isPaused = true;
  chrome.storage.local.set({ isPaused });
  stopMusic();
};

const startTimer = async (): Promise<void> => {
  clearInterval(interval);
  blockAllSites();
  isRunning = true;
  isBreak = isPaused ? isBreak : false;
  isPaused = false;
  chrome.storage.local.set({ isRunning, isBreak, isPaused });

  // Start playing music if enabled
  await playMusic();

  chrome.storage.local.get("todos", (result) => {
    todosStateAtStart = result.todos || [];
  });
  completedTodos = [];

  interval = setInterval(() => {
    time -= 1000;

    if (time <= 0) {
      handleTimeEnds();
    } else {
      chrome.storage.local.set({ time });
    }

    updateBadge(time);
  }, 1000);
};

const stopTimer = async (): Promise<void> => {
  if (pomodoroCount >= 1 || ultraFocusMode) {
    recordPomodoroHistory();
    chrome.storage.session.set({ pomodoroCount: 0 });
  }

  clearInterval(interval);
  time = WORK_TIME;
  isRunning = false;
  isBreak = false;
  isPaused = false;

  // Stop music when timer stops
  stopMusic();

  await chrome.storage.local.set({ isRunning, time, isBreak, isPaused });

  completedTodos = [];
  pomodoroCount = 0;
  chrome.action.setBadgeBackgroundColor({ color: "#40A662" });
  updateBadge(time);
  unBlockAllSites();
};

export const handleTimeEnds = async (): Promise<void> => {
  if (selectedSound && isSoundEnabled) {
    await playSound();
  }

  if (ultraFocusMode) {
    pomodoroCount++;
    await stopTimer();
    createNotification({
      title: "Session ended! 🎉",
      message: "You have completed your ultra focus session!",
    });
    return;
  }

  pomodoroCount = isBreak ? pomodoroCount : pomodoroCount + 1;
  isBreak = !isBreak;
  isPaused = false;
  let isLongBreak = pomodoroCount % 4 === 0;

  if (isBreak) {
    unBlockAllSites();
    stopMusic();
  } else {
    blockAllSites();
    if (isMusicEnabled) {
      await playMusic();
    }
  }

  if (isBreak && isLongBreak) {
    time = LONG_BREAK_TIME;

    if (isNotificationEnabled) {
      createNotification({
        title: "Long Break! ✨",
        message: "Fantastic work session! Time for a proper recharge!",
      });
    }
  } else {
    time = isBreak ? BREAK_TIME : WORK_TIME;

    if (isNotificationEnabled) {
      createNotification({
        title: isBreak ? "Quick break! ☀️" : "Focus time! ⚡",
        message: isBreak ? "Take a break and recharge." : "Let's get to work!",
      });
    }
  }

  chrome.storage.local.set({ isBreak, time, isLongBreak, isPaused });
  chrome.storage.session.set({ pomodoroCount });
  const badgeColor = isBreak ? "#ffccd5" : "#40A662";
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
};

const ensureOffscreenDocument = async (): Promise<void> => {
  try {
    const hasDocument = await chrome.offscreen.hasDocument();
    if (!hasDocument) {
      await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL("offscreen.html"),
        // @ts-ignore
        reasons: ["AUDIO_PLAYBACK"],
        justification: "Pomodoro Grande needs to play sounds",
      });
    }
  } catch (error) {
    console.error("Error managing offscreen document:", error);
  }
};

const playSound = async (): Promise<void> => {
  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({
    action: "playSound",
    isSoundEnabled,
    selectedSound,
    soundVolume,
  });
};

const playMusic = async (): Promise<void> => {
  if (!isMusicEnabled || !selectedMusic || isBreak) return;

  await ensureOffscreenDocument();
  chrome.runtime.sendMessage({
    action: "playMusic",
    isMusicEnabled,
    selectedMusic,
    musicVolume,
    isRunning,
  });
};

const stopMusic = () => {
  chrome.runtime.sendMessage({
    action: "stopMusic",
    isMusicEnabled,
    selectedMusic,
    musicVolume,
  });
};

//*************** Pomodoro history *******************/
export const recordPomodoroHistory = (): void => {
  /**
    * If ultraFocusMode is enabled, calculate the total milliseconds spent on the session (no need to finish the timer)
      Otherwise, calculate the total milliseconds spent on all completed pomodoros
    */
  const totalMilliseconds = ultraFocusMode
    ? WORK_TIME - time
    : pomodoroCount * WORK_TIME;

  const totalWorkTime = totalMilliseconds / 1000 / 60;

  chrome.storage.local.get("pomodoroHistory", (result) => {
    const history: PomodoroHistory[] = result.pomodoroHistory || [];
    const newData = {
      createdAt: new Date().toLocaleString(),
      totalPomodoros: pomodoroCount,
      completedTodos: completedTodos.length,
      totalWorkTime,
    };

    const aggregatedHistory: PomodoroHistory[] = Object.values(
      [...history, newData].reduce((acc, current) => {
        const date = new Date(current.createdAt).toISOString().split("T")[0];

        if (!acc[date]) {
          acc[date] = { ...current, createdAt: date };
        } else {
          acc[date].totalPomodoros += current.totalPomodoros;
          acc[date].completedTodos += current.completedTodos;
          acc[date].totalWorkTime += current.totalWorkTime;
        }

        return acc;
      }, {} as { [key: string]: PomodoroHistory })
    );

    const trimmedHistory = aggregatedHistory.slice(-100);
    chrome.storage.local.set({ pomodoroHistory: trimmedHistory });
  });
};
