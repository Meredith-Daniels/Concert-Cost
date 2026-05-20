import { NearbyConcerts } from "@/components/NearbyConcerts";
import { PageHeader } from "@/components/PageHeader";

export default function NearbyPage() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Nearby concerts"
        subtitle="Real upcoming shows near you from Songkick — no API key required."
      />
      <NearbyConcerts />
    </section>
  );
}
