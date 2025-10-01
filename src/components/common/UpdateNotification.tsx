import { APP_VERSION } from "@/constants";
import { X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const APPEAR_DELAY = 1500;
const AUTO_DISMISS = 5000;

const UpdateNotification = () => {
  const [visible, setVisible] = useState(false);
  const appearTimer = useRef<NodeJS.Timeout | null>(null);
  const autoDismissTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    chrome.storage.local.get("isUpdateNotificationVisible", (data) => {
      // If undefined or true, show notification
      const shouldShow = data.isUpdateNotificationVisible !== false;
      if (shouldShow) {
        appearTimer.current = setTimeout(() => setVisible(true), APPEAR_DELAY);
      }
    });
    return () => {
      if (appearTimer.current) clearTimeout(appearTimer.current);
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      autoDismissTimer.current = setTimeout(() => {
        setVisible(false);
        chrome.storage.local.set({ isUpdateNotificationVisible: false });
      }, AUTO_DISMISS);
    }
    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    chrome.storage.local.set({ isUpdateNotificationVisible: false });
  };

  if (!visible) return null;

  return (
    <div className="fixed w-[90%] top-6 left-1/2 -translate-x-1/2 z-50 border-gray-200 text-white bg-primary-custom/80 backdrop-blur-sm shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 animate-fade-in transition-all">
      <div className="flex-1 flex flex-col gap-1">
        <p className="font-medium text-sm">✨ {APP_VERSION} is here!</p>
        <p className="text-xs max-w-[90%]">Enjoy new enhancements and fixes.</p>
      </div>
      <button
        className="px-2 py-1 text-xs text-white"
        onClick={handleClose}
        aria-label="Dismiss update notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default UpdateNotification;
