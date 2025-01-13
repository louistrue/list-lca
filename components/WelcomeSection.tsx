"use client";

import { ThemeToggle } from "./ThemeToggle";
import { Github, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function WelcomeSection() {
  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-8 rounded-lg shadow-sm border border-blue-100 dark:border-gray-700 mb-4 w-full">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-8">
            <Image
              src="/logo.svg"
              alt="LCA Tool Logo"
              width={120}
              height={120}
              className="dark:[filter:brightness(0)_saturate(100%)_invert(89%)_sepia(88%)_saturate(361%)_hue-rotate(359deg)_brightness(103%)_contrast(103%)] hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Ökobilanzierung: MAS FHNW Digitales Bauen
              </h1>
              <span className="block text-xl font-medium text-blue-600 dark:text-blue-400 mt-2">
                CAS Integriertes Projektmanagement
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            Ein einfaches Hilfsmittel für die Berechnung der Ökobilanz im Rahmen
            des CAS. Laden Sie Ihre Mengendaten als CSV-Datei hoch und das Tool
            hilft Ihnen bei:
          </p>

          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Automatischer Zuordnung von KBOB Materialien</li>
            <li>Berechnung von CO₂, UBP und Primärenergie</li>
            <li>Gruppierung und Summierung ähnlicher Bauteile</li>
            <li>Export der Ergebnisse für weitere Analysen</li>
          </ul>

          <div className="text-sm text-gray-500 dark:text-gray-400 pt-2">
            Hinweis: Dies ist ein vereinfachtes Hilfsmittel für Übungszwecke.
            Für professionelle Ökobilanzierung nutzen Sie bitte spezialisierte
            Software.
          </div>
        </div>
      </div>

      <div className="w-full mb-8 flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          <span>
            Ökobilanzindikatoren via{" "}
            <a
              href="https://www.lcadata.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              LCAdata.ch
            </a>
            , von{" "}
            <a
              href="https://www.kbob.admin.ch/de/oekobilanzdaten-im-baubereich"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              KBOB: Ökobilanzdaten im Baubereich
            </a>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Github className="h-4 w-4" />
          <span>
            Quellcode verfügbar auf{" "}
            <a
              href="https://github.com/louistrue/list-lca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              GitHub
            </a>
            . Studierende können den Code einsehen, um mehr über moderne
            Webtechnologien zu lernen
          </span>
        </div>
      </div>
    </>
  );
}
