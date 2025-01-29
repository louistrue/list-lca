import WelcomeSection from "../components/WelcomeSection";
import ConstructionLCACalculator from "../components/ConstructionLCACalculator";

export default function Home() {
  return (
    <main className="w-full px-4">
      <WelcomeSection />
      <ConstructionLCACalculator />
    </main>
  );
}
