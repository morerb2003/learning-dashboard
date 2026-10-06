import { getRedisClient } from "./redis.ts";

export interface CourseViewStats {
  total: number;
  unique: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  avatarUrl?: string | null;
}

export interface ActivityPulseEvent {
  id: string;
  type: "enrollment" | "lesson_complete" | "quiz_pass" | "certificate" | "review";
  title: string;
  actor: string;
  timestamp: string;
}

// In-memory fallbacks when Redis is in memory mode or unconfigured
const memoryCourseViews = new Map<string, { total: number; viewers: Set<string> }>();
const memoryLeaderboard = new Map<string, { name: string; xp: number; avatarUrl?: string | null }>();
const memoryActivityFeed: ActivityPulseEvent[] = [
  {
    id: "act-demo-1",
    type: "enrollment",
    title: "Fullstack Next.js & React 19 Mastery",
    actor: "Alex Chen",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "act-demo-2",
    type: "lesson_complete",
    title: "Completed Lesson: Server Actions & Cache",
    actor: "Sarah Miller",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "act-demo-3",
    type: "certificate",
    title: "Earned Verified Certificate in UI Design",
    actor: "Liam Patel",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

/**
 * Record a course view in Redis.
 * Increments total views counter and tracks unique viewer per day.
 */
export async function recordCourseView(
  courseId: string,
  viewerId = "anon"
): Promise<CourseViewStats> {
  const redis = getRedisClient();
  const totalKey = `aura:stats:course:views:${courseId}`;
  const uniqueKey = `aura:stats:course:viewers:${courseId}`;

  if (redis) {
    try {
      const isNew = await redis.sadd(uniqueKey, viewerId);
      if (isNew) {
        await redis.expire(uniqueKey, 60 * 60 * 24); // 24h retention
      }
      const total = await redis.incr(totalKey);
      const unique = await redis.scard(uniqueKey);
      return { total, unique };
    } catch (error) {
      console.warn(`[Telemetry] Redis recordCourseView failed for ${courseId}:`, error);
    }
  }

  // Memory fallback
  const entry = memoryCourseViews.get(courseId) || { total: 0, viewers: new Set<string>() };
  entry.total += 1;
  entry.viewers.add(viewerId);
  memoryCourseViews.set(courseId, entry);

  return { total: entry.total, unique: entry.viewers.size };
}

/**
 * Retrieve total and unique view stats for a course.
 */
export async function getCourseViews(courseId: string): Promise<CourseViewStats> {
  const redis = getRedisClient();
  const totalKey = `aura:stats:course:views:${courseId}`;
  const uniqueKey = `aura:stats:course:viewers:${courseId}`;

  if (redis) {
    try {
      const [total, unique] = await Promise.all([
        redis.get<number>(totalKey),
        redis.scard(uniqueKey),
      ]);
      return {
        total: total ? Number(total) : 0,
        unique: unique ? Number(unique) : 0,
      };
    } catch (error) {
      console.warn(`[Telemetry] Redis getCourseViews failed for ${courseId}:`, error);
    }
  }

  const entry = memoryCourseViews.get(courseId);
  return {
    total: entry?.total ?? 142, // baseline demonstration count
    unique: entry?.viewers.size ?? 38,
  };
}

/**
 * Record XP earned by a student and update the weekly live leaderboard.
 */
export async function recordLearnerXP(
  userId: string,
  userName: string,
  xpIncrement: number,
  avatarUrl?: string | null
): Promise<number> {
  const redis = getRedisClient();
  const zsetKey = "aura:leaderboard:weekly";
  const userMetaKey = `aura:leaderboard:meta:${userId}`;

  if (redis) {
    try {
      const newScore = await redis.zincrby(zsetKey, xpIncrement, userId);
      await redis.set(
        userMetaKey,
        JSON.stringify({ name: userName, avatarUrl: avatarUrl || null }),
        { ex: 60 * 60 * 24 * 7 } // 7 days
      );
      return Number(newScore);
    } catch (error) {
      console.warn(`[Telemetry] Redis recordLearnerXP failed for ${userId}:`, error);
    }
  }

  const existing = memoryLeaderboard.get(userId) || { name: userName, xp: 0, avatarUrl };
  existing.xp += xpIncrement;
  existing.name = userName;
  if (avatarUrl) existing.avatarUrl = avatarUrl;
  memoryLeaderboard.set(userId, existing);
  return existing.xp;
}

export const recordLearnerXp = recordLearnerXP;

/**
 * Retrieve top learners from the weekly live leaderboard.
 */
export async function getLearnerLeaderboard(limit = 5): Promise<LeaderboardEntry[]> {
  const redis = getRedisClient();
  const zsetKey = "aura:leaderboard:weekly";

  if (redis) {
    try {
      // Fetch top user IDs sorted by score descending with scores
      const result = await redis.zrange<string[]>(zsetKey, 0, limit - 1, {
        rev: true,
        withScores: true,
      });

      if (result && result.length > 0) {
        const entries: LeaderboardEntry[] = [];
        // Result is in pairs: [userId, score, userId, score, ...]
        for (let i = 0; i < result.length; i += 2) {
          const userId = result[i];
          const score = Number(result[i + 1] || 0);
          const metaRaw = await redis.get<string>(`aura:leaderboard:meta:${userId}`);
          let name = "Learner";
          let avatarUrl: string | null = null;
          if (metaRaw) {
            try {
              const parsed = typeof metaRaw === "string" ? JSON.parse(metaRaw) : metaRaw;
              name = parsed.name || name;
              avatarUrl = parsed.avatarUrl || null;
            } catch {
              // Ignore
            }
          }
          entries.push({
            rank: Math.floor(i / 2) + 1,
            userId,
            name,
            xp: score,
            avatarUrl,
          });
        }
        if (entries.length > 0) return entries;
      }
    } catch (error) {
      console.warn("[Telemetry] Redis getLearnerLeaderboard failed:", error);
    }
  }

  if (memoryLeaderboard.size > 0) {
    const list = Array.from(memoryLeaderboard.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((item, idx) => ({
        rank: idx + 1,
        userId: item.userId,
        name: item.name,
        xp: item.xp,
        avatarUrl: item.avatarUrl,
      }));
    return list;
  }

  // Baseline mock entries if leaderboard is fresh
  const baseline: LeaderboardEntry[] = [
    { rank: 1, userId: "u-1", name: "David Kim", xp: 1250, avatarUrl: null },
    { rank: 2, userId: "u-2", name: "Elena Rostova", xp: 980, avatarUrl: null },
    { rank: 3, userId: "u-3", name: "Marcus Vance", xp: 840, avatarUrl: null },
    { rank: 4, userId: "u-4", name: "Chloe Dupont", xp: 720, avatarUrl: null },
    { rank: 5, userId: "u-5", name: "Aria Thorne", xp: 610, avatarUrl: null },
  ];

  return baseline.slice(0, limit);
}

/**
 * Record a live event in the global activity stream.
 */
export async function recordActivityPulse(
  event: Omit<ActivityPulseEvent, "id" | "timestamp">
): Promise<void> {
  const pulseEvent: ActivityPulseEvent = {
    ...event,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const redis = getRedisClient();
  const listKey = "aura:activity:pulse";

  if (redis) {
    try {
      await redis.lpush(listKey, JSON.stringify(pulseEvent));
      await redis.ltrim(listKey, 0, 49); // Keep latest 50 events
      return;
    } catch (error) {
      console.warn("[Telemetry] Redis recordActivityPulse failed:", error);
    }
  }

  memoryActivityFeed.unshift(pulseEvent);
  if (memoryActivityFeed.length > 50) memoryActivityFeed.pop();
}

/**
 * Retrieve recent events from the live activity stream.
 */
export async function getRecentActivityFeed(limit = 6): Promise<ActivityPulseEvent[]> {
  const redis = getRedisClient();
  const listKey = "aura:activity:pulse";

  if (redis) {
    try {
      const items = await redis.lrange<string[]>(listKey, 0, limit - 1);
      if (items && items.length > 0) {
        return items.map((raw) => (typeof raw === "string" ? JSON.parse(raw) : raw));
      }
    } catch (error) {
      console.warn("[Telemetry] Redis getRecentActivityFeed failed:", error);
    }
  }

  return memoryActivityFeed.slice(0, limit);
}
