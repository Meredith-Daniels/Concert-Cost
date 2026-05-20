import { LikedConcertsList } from "@/components/LikedConcertsList";
import { PageHeader } from "@/components/PageHeader";

export default function LikedConcertsPage() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Liked concerts"
        subtitle="Shows you saved from Nearby so you don't forget them."
      />
      <LikedConcertsList />
    </section>
  );
}
