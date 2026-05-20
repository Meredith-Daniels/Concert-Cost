import { ConcertForm } from "@/components/ConcertForm";
import { PageHeader } from "@/components/PageHeader";

export default function AddConcertPage() {
  return (
    <section className="section-gap">
      <PageHeader
        title="Add Concert"
        subtitle="Log a show you attended. Total cost is calculated automatically."
      />
      <ConcertForm />
    </section>
  );
}
