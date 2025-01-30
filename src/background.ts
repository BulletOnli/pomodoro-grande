import { action } from "webextension-polyfill";
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

let interval: NodeJS.Timeout | undefined;
let time = WORK_TIME;
let pomodoroCount = 0; // 1 Work = 1 Pomodoro

let selectedSound = "clock.mp3";
let isSoundEnabled = true;
let soundVolume = 0.5;

let isNotificationEnabled = true;

let completedTodos: Todo[] = [];
let todosStateAtStart: Todo[] = [];

const updateVariables = (changes: StorageChanges): void => {
  if (changes.workTime) {
    time = changes.workTime;
    WORK_TIME = changes.workTime;
  }
  if (changes.breakTime) BREAK_TIME = changes.breakTime;
  if (changes.longBreak) LONG_BREAK_TIME = changes.longBreak;

  if (changes.selectedSound) selectedSound = changes.selectedSound;
  if (changes.soundVolume !== undefined) soundVolume = changes.soundVolume;

  if (changes.isRunning !== undefined) isRunning = changes.isRunning;
  if (changes.isSoundEnabled !== undefined) {
    isSoundEnabled = changes.isSoundEnabled;
  }
  if (changes.isNotificationEnabled !== undefined) {
    isNotificationEnabled = changes.isNotificationEnabled;
  }
};

chrome.storage.local.get(
  [
    "workTime",
    "breakTime",
    "selectedSound",
    "isSoundEnabled",
    "soundVolume",
    "longBreak",
    "isNotificationEnabled",
  ],
  (result) => updateVariables(result as StorageChanges)
);

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#40A662" });
  updateBadge(time);
  chrome.storage.local.set({
    workTime: WORK_TIME,
    breakTime: BREAK_TIME,
    longBreak: LONG_BREAK_TIME,
    blockedSites: BLOCKED_SITES,
  });
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
});

chrome.runtime.onMessage.addListener(
  (message: any, _sender: any, sendResponse: any) => {
    if (message.action === "getTimerState") {
      sendResponse({ time, isRunning, isBreak });
    }

    if (message.action === "startTimer") {
      startTimer();
    }

    if (message.action === "stopTimer") {
      stopTimer();
    }

    if (message.action === "skipTimer") {
      time = 0;
      sendResponse({ time });
    }

    if (message.action === "updateTimerSettings") {
      const { workTime, longBreak, breakTime } = message;
      time = workTime;

      updateBadge(time);
      chrome.storage.local.set({ workTime, longBreak, breakTime });
      chrome.runtime.sendMessage({
        action: "getTimerState",
        time,
        isRunning,
        isBreak,
      });
    }
  }
);

const startTimer = (): void => {
  isRunning = true;
  isBreak = false;
  clearInterval(interval);
  blockAllSites();

  chrome.storage.local.get("todos", (result) => {
    todosStateAtStart = result.todos || [];
  });
  completedTodos = [];

  interval = setInterval(() => {
    time -= 1000;

    if (time <= 0) {
      handleTimeEnds();
    } else {
      chrome.runtime.sendMessage({
        action: "getTimerState",
        time,
        isRunning,
        isBreak,
      });
    }

    updateBadge(time);
  }, 1000);
};

const stopTimer = async (): Promise<void> => {
  if (pomodoroCount >= 1) {
    recordPomodoroHistory();
  }

  clearInterval(interval);
  time = WORK_TIME;
  isRunning = false;
  isBreak = false;
  await chrome.runtime.sendMessage({
    action: "getTimerState",
    time,
    isRunning,
    isBreak,
  });

  completedTodos = [];
  pomodoroCount = 0;
  chrome.action.setBadgeBackgroundColor({ color: "#40A662" });
  updateBadge(time);
  unBlockAllSites();
};

const handleTimeEnds = (): void => {
  if (selectedSound && isSoundEnabled) {
    playSound();
  }

  let isLongBreak = false;
  pomodoroCount = isBreak ? pomodoroCount : pomodoroCount + 1;
  isBreak = !isBreak;

  if (isBreak) {
    unBlockAllSites();
  } else {
    blockAllSites();
  }

  if (isBreak && pomodoroCount % 4 === 0) {
    time = LONG_BREAK_TIME;
    isLongBreak = true;
    // chrome.storage.local.set({ isBreak, time, isLongBreak: true });

    if (isNotificationEnabled) {
      createNotification({
        title: "Long Break! ✨",
        message: "Fantastic work session! Time for a proper recharge!",
      });
    }
  } else {
    time = isBreak ? BREAK_TIME : WORK_TIME;
    isLongBreak = false;
    // chrome.storage.local.set({ isBreak, time, isLongBreak: false });

    if (isNotificationEnabled) {
      createNotification({
        title: isBreak ? "Quick break! ☀️" : "Focus time! ⚡",
        message: isBreak ? "Take a break and recharge." : "Let's get to work!",
      });
    }
  }

  chrome.runtime.sendMessage({
    action: "getTimerState",
    isBreak,
    time,
    isLongBreak,
  });

  const badgeColor = isBreak ? "#ffccd5" : "#40A662";
  chrome.action.setBadgeBackgroundColor({ color: badgeColor });
};

const ensureOffscreenDocument = (callback?: () => void): void => {
  chrome.offscreen.hasDocument().then((hasDocument) => {
    if (!hasDocument) {
      chrome.offscreen
        .createDocument({
          url: chrome.runtime.getURL("offscreen.html"),
          // @ts-ignore
          reasons: ["AUDIO_PLAYBACK"],
          justification: "Play notification sounds for timers",
        })
        .then(() => {
          if (callback) callback();
        });
    } else {
      if (callback) callback();
    }
  });
};

const playSound = (): void => {
  ensureOffscreenDocument(() => {
    chrome.runtime.sendMessage({
      action: "playSound",
      isSoundEnabled,
      selectedSound,
      soundVolume,
    });
  });
};

//*************** Pomodoro history *******************/
const recordPomodoroHistory = (): void => {
  chrome.storage.sync.get("pomodoroHistory", (result) => {
    const history: PomodoroHistory[] = result.pomodoroHistory || [];
    const newData = {
      createdAt: new Date().toLocaleString(),
      totalPomodoros: pomodoroCount,
      completedTodos: completedTodos.length,
      totalWorkTime: (pomodoroCount * WORK_TIME) / 1000 / 60,
    };
    history.push(newData);
    // Keep only the last 100 entries
    const trimmedHistory = history.slice(-100);
    chrome.storage.sync.set({ pomodoroHistory: trimmedHistory });
  });
};
