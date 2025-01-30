import { X } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

const ReviewReminder = () => {
  const [showReminder, setShowReminder] = useState(true);

  const handleClose = () => {
    setShowReminder(false);
    chrome.storage.local.set({});
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    chrome.storage.local.get("pomodoroHistory", (result) => {
      if (result.pomodoroHistory?.length > 5) {
        setShowReminder(true);

        timeout = setTimeout(() => {
          setShowReminder(false);
        }, 10_000);
      }
    });
  }, []);

  if (!showReminder) return;

  return (
    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pl-4 pr-2 py-2 w-11/12 flex items-center  justify-center rounded-full bg-primary-custom shadow text-white text-xs text-center border border-yellow-300">
      <p>
        Love the extension? Share the ❤️ with a{" "}
        <a
          href="https://chromewebstore.google.com/detail/pomodoro-grande/hmkklgcpkihbecjbohepediganhefdof/reviews"
          target="_blank"
          className="underline"
        >
          quick review!
        </a>
      </p>
      <Button
        size="icon"
        className="size-5 hover:size-6 transition-all  fixed -right-2 rounded-full bg-primary-custom hover:bg-primary-custom/80 hover:text-white"
        variant="outline"
        onClick={handleClose}
      >
        <X />
      </Button>
    </div>
  );
};

export default ReviewReminder;
