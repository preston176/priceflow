import { notFound } from "next/navigation";
import { Gift, Heart } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SharedGiftCard } from "@/components/shared-gift-card";
import { getSharedWishlist } from "@/actions/share-actions";

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getSharedWishlist(token);

  if (!data) {
    notFound();
  }

  const { list, profile, gifts } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">PriceFlow</h1>
          </Link>
          <Button asChild>
            <Link href="/sign-up">Create Your Own</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 mb-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.imageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {profile.name}&apos;s {list.name}
                </h2>
                {list.description && (
                  <p className="text-muted-foreground mb-2">{list.description}</p>
                )}
                <p className="text-muted-foreground flex items-center justify-center gap-2">
                  <Heart className="h-4 w-4 fill-current text-red-500" />
                  {gifts.length} item{gifts.length !== 1 ? "s" : ""} to choose from
                </p>
              </div>
            </div>
          </Card>

          {gifts.length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    No items on the wishlist yet
                  </h3>
                  <p className="text-muted-foreground">
                    Check back later for updates
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gifts.map((gift) => (
                <SharedGiftCard key={gift.id} gift={gift} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Want to create your own wishlist?
            </p>
            <Button asChild size="lg">
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <Link href="/" className="hover:text-foreground underline">
              PriceFlow
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
