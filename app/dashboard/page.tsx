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
  let lists = await getUserLists(false); // Only active lists
  const archivedLists = await getUserLists(true); // All lists including archived

  // Create default list if none exist
  if (lists.length === 0) {
    const defaultList = await createList({
      name: "My Wishlist",
      description: "Default wishlist",
      budget: "0",
    });
    lists = [defaultList];
  }

  const params = await searchParams;
  const currentListId = params.list || lists.find((l) => l.isDefault)?.id || lists[0]?.id;
  const gifts = await getUserGifts(currentListId);

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
