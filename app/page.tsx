import WelcomeSection from "../components/WelcomeSection";
import ConstructionLCACalculator from "../components/ConstructionLCACalculator";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <WelcomeSection />
      <ConstructionLCACalculator />
    </main>
  );
}
