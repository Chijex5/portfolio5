import Activity from "@/components/about/Activity";
import Story from "@/components/story/Story";
import { getActivity } from "@/lib/github";

export default async function Home() {
  const activity = await getActivity("chijex5");
  return (
    <main id="main">
      <Story activity={activity && <Activity data={activity} />} />
    </main>
  );
}
