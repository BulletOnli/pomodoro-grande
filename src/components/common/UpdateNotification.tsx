import { APP_VERSION } from "@/constants";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

const DEFAULT_DURATION = 5000;
const APPEAR_DELAY = 1500;

const UpdateNotification = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const appearTimer = setTimeout(() => setVisible(true), APPEAR_DELAY);
    return () => clearTimeout(appearTimer);
  }, []);

  useEffect(() => {
    if (visible) {
      const hideTimer = setTimeout(() => setVisible(false), DEFAULT_DURATION);
      return () => clearTimeout(hideTimer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed w-[90%] top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-gray-200 shadow-lg rounded-md px-4 py-2 flex items-center gap-2 animate-fade-in transition-all">
      <div className="flex-1 flex flex-col gap-1">
        <p className="font-semibold text-sm">✨ {APP_VERSION} is here!</p>
        <p className="text-xs max-w-[90%]">Enjoy new enhancements and fixes.</p>
      </div>

      <button
        className="px-2 py-1 text-xs text-primary-custom/80 hover:text-primary-custom"
        onClick={() => setVisible(false)}
        aria-label="Dismiss update notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export default UpdateNotification;
