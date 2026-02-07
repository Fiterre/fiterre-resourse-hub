export type TierLevel = "1" | "2" | "3" | "4" | "5";

export const tierLabels: Record<TierLevel, string> = {
  "1": "Tier 1 (経営層)",
  "2": "Tier 2 (マネージャー)",
  "3": "Tier 3 (リーダー)",
  "4": "Tier 4 (正社員)",
  "5": "Tier 5 (研修生)",
};

export const tierColors: Record<TierLevel, string> = {
  "1": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "2": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "3": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "4": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "5": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export type AccessLevel = "public" | "tier";

export const accessLabels: Record<AccessLevel, string> = {
  public: "公開",
  tier: "Tier制限",
};

export const accessColors: Record<AccessLevel, string> = {
  public: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  tier: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export type ResourceIcon =
  | "settings"
  | "file-text"
  | "app-window"
  | "dumbbell"
  | "message-circle"
  | "calculator"
  | "users"
  | "calendar"
  | "video"
  | "book"
  | "link"
  | "clipboard";
