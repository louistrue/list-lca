"use client";

export default function WelcomeSection() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-sm border border-blue-100 mb-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Ökobilanzierung: MAS FHNW Digitales Bauen
          <span className="block text-lg font-normal text-blue-600 mt-1">
            CAS Integriertes Projektmanagement
          </span>
        </h1>
        
        <div className="space-y-4 text-gray-600">
          <p>
            Ein einfaches Hilfsmittel für die Berechnung der Ökobilanz im Rahmen des CAS. 
            Laden Sie Ihre Mengendaten als CSV-Datei hoch und das Tool hilft Ihnen bei:
          </p>
          
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Automatischer Zuordnung von KBOB Materialien</li>
            <li>Berechnung von CO₂, UBP und Primärenergie</li>
            <li>Gruppierung und Summierung ähnlicher Bauteile</li>
            <li>Export der Ergebnisse für weitere Analysen</li>
          </ul>

          <div className="text-sm text-gray-500 pt-2">
            Hinweis: Dies ist ein vereinfachtes Hilfsmittel für Übungszwecke. Für professionelle 
            Ökobilanzen nutzen Sie bitte spezialisierte Software.
          </div>
        </div>
      </div>
    </div>
  );
} 