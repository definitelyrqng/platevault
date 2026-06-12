/**
 * Engine/variant badge options per Brand → Model.
 * These are the badges physically shown on the car (e.g. "3.0 TDI", "320d").
 * Separate from marketing trim levels ("S Line", "M Sport").
 */
const MODEL_BADGES: Record<string, string[]> = {
  "Audi::A6": [
    "1.8 TFSI",
    "2.0 TDI",
    "2.0 TFSI",
    "3.0 TDI",
    "3.0 TFSI",
    "40 TDI",
    "45 TDI",
    "50 TDI",
    "45 TFSI",
    "55 TFSI",
    "S6",
    "RS6",
  ],

  // BMW "3 Series" coming soon
  // "BMW::3 Series": ["316i","318i","320i","325i","330i","316d","318d","320d","325d","330d","M340i","M3"],
};

export function getBadges(brand: string, model: string): string[] {
  return MODEL_BADGES[`${brand}::${model}`] ?? [];
}
