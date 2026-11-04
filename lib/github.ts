/**
 * CJ's GitHub contribution calendar, for the activity block on the home page.
 *
 * GitHub has no public API for the calendar, so this reads a community mirror
 * of it. Fetched on the server and revalidated daily; when the mirror is down
 * or unreachable the block is simply left out.
 */

export type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
export type Activity = { total: number; days: Day[] };

const SOURCE = "https://github-contributions-api.jogruber.de/v4";

export async function getActivity(user: string): Promise<Activity | null> {
  try {
    const res = await fetch(`${SOURCE}/${user}?y=last`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      total?: { lastYear?: number };
      contributions?: Day[];
    };
    const days = data.contributions ?? [];
    if (!days.length) return null;
    return {
      total: data.total?.lastYear ?? days.reduce((sum, d) => sum + d.count, 0),
      days,
    };
  } catch {
    return null;
  }
}
