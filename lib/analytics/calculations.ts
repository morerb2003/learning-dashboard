export function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function percentage(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(Math.round((completed / total) * 100), 100);
}

export function calculateStreak(
  activityDates: string[],
  referenceDate = new Date()
) {
  const activeDates = new Set(
    activityDates.map((value) => new Date(value).toISOString().slice(0, 10))
  );
  const cursor = new Date(referenceDate);

  if (!activeDates.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function buildWeeklyActivity(
  activityDates: string[],
  referenceDate = new Date()
) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      day: date.toLocaleDateString("en", { weekday: "short" }),
      modules: activityDates.filter(
        (value) => new Date(value).toISOString().slice(0, 10) === key
      ).length,
    };
  });
}
