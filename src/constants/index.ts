export const ONE_MINUTE = 1000 * 60;
export const FIVE_MINUTES = ONE_MINUTE * 5;
export const ONE_HOUR = ONE_MINUTE * 60;

export const WORKING_OPTIONS = [5, 10, 15, 20, 30, 45, 60].map((option) =>
  (option * ONE_MINUTE).toString()
);

export const BREAK_OPTIONS = [3, 5, 10, 15].map((option) =>
  (option * ONE_MINUTE).toString()
);

export const LONG_BREAK_OPTIONS = [1, 15, 20, 25, 30].map((option) =>
  (option * ONE_MINUTE).toString()
);

export const ULTRA_FOCUS_MODE_OPTIONS = [25, 60, 120, 180, 240, 300].map(
  (option) => (option * ONE_MINUTE).toString()
);

export const REVIEW_PAGE =
  "https://chromewebstore.google.com/detail/pomodoro-grande/hmkklgcpkihbecjbohepediganhefdof/reviews";

export const RELEASE_NOTES_URL =
  "https://github.com/BulletOnli/pomodoro-grande/releases";

export const APP_VERSION = "v2.6.0";

export const FEEDBACK_FORM_URL = "https://forms.gle/SQ6JwgWiRv79FDPv5";
