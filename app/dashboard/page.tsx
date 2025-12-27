import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ensureProfile } from "@/actions/profile-actions";
import { getUserGifts } from "@/actions/gift-actions";
import { getUserLists, createList } from "@/actions/list-actions";
import { DashboardContent } from "@/components/dashboard-content";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const profile = await ensureProfile();
  const lists = await getUserLists(false); // Only active lists
  const archivedLists = await getUserLists(true); // All lists including archived

  const params = await searchParams;
  const currentListId = params.list || lists.find((l) => l.isDefault)?.id || lists[0]?.id;
  const gifts = currentListId ? await getUserGifts(currentListId) : [];

  // Filter to get only archived lists
  const onlyArchived = archivedLists.filter((l) => l.isArchived);

  return (
    <DashboardContent
      profile={profile}
      lists={lists}
      archivedLists={onlyArchived}
      initialListId={currentListId}
      initialGifts={gifts}
    />
  );
}
