/** Reasons a spot can be reported for (same idea as PlatesMania's "Error message" dialog). */
export const REPORT_CATEGORIES = [
  { value: "plate",       icon: "🔤", label: "Incorrect license plate",                              short: "Incorrect plate" },
  { value: "brand_model", icon: "🚗", label: "Incorrect brand or model of vehicle",                  short: "Incorrect brand / model" },
  { value: "photo",       icon: "🖼️", label: "Problems with the photo (missing, or plate can't be seen)", short: "Photo problem" },
  { value: "delete",      icon: "🗑️", label: "Delete this spot",                                     short: "Delete request" },
  { value: "other",       icon: "💬", label: "Other errors",                                         short: "Other" },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]["value"];

export const isReportCategory = (v: string): v is ReportCategory => REPORT_CATEGORIES.some((c) => c.value === v);
export const reportCategory = (v: string) => REPORT_CATEGORIES.find((c) => c.value === v);
