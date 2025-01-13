import WelcomeSection from "../components/WelcomeSection";
import ConstructionLCACalculator from "../components/ConstructionLCACalculator";

export default function Home() {
  return (
    <main className="p-8">
      <WelcomeSection />
      <ConstructionLCACalculator />
    </main>
  );
}
