/** Fictional contracts for the Cockpit demo (Wohnanlage Lindenhof, Haus B). */

export type Vertrag = {
  /** Header lines: contract number, date and parties. */
  kopf: string[];
  paragraphen: { titel: string; text: string }[];
  unterschrift: string;
};

const VOB =
  "Es gilt die VOB/B in der bei Vertragsabschluss gültigen Fassung. Ergänzend gelten die VOB/C (ATV) und die anerkannten Regeln der Technik.";
const GERICHTSSTAND =
  "Gerichtsstand und Erfüllungsort ist München. Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.";
const SCHRIFTFORM =
  "Änderungen und Ergänzungen dieses Vertrags bedürfen der Schriftform. Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.";

export const TRANSPORTBETON_VERTRAG: Vertrag = {
  kopf: [
    "Liefervertrag Nr. LV-2026-0412",
    "vom 14.10.2026",
    "Auftraggeber: Musterbau GmbH, Leopoldstraße 112, 80802 München",
    "Lieferant: Isar Transportbeton GmbH, Werkstraße 8, 85748 Garching",
    "Bauvorhaben: Wohnanlage Lindenhof, Haus B",
  ],
  paragraphen: [
    {
      titel: "Vertragsgegenstand",
      text: "Der Lieferant liefert dem Auftraggeber für das Bauvorhaben Transportbeton nach DIN EN 206 und DIN 1045-2 frei Baustelle, einschließlich Abladen in die bauseitige Betonpumpe.",
    },
    {
      titel: "Lieferumfang und Sorten",
      text: "Geplant sind rund 640 m³ der Sorte C25/30 XC2 F3 (16 mm) für Bodenplatte und Kellerwände sowie rund 180 m³ der Sorte C30/37 XC4 WU F3 für die weiße Wanne. Mengenabweichungen von bis zu 10 % sind ohne Preisanpassung zulässig.",
    },
    {
      titel: "Abruf und Lieferzeit",
      text: "Abrufe erfolgen durch die Bauleitung mindestens 24 Stunden vor dem Liefertermin, Montag bis Freitag zwischen 06:30 und 17:00 Uhr. Bestätigte Liefertermine sind verbindlich. Verzögert sich die Ankunft um mehr als 60 Minuten, informiert der Lieferant die Bauleitung unverzüglich telefonisch.",
    },
    {
      titel: "Wartezeiten",
      text: "Wartezeiten des Fahrmischers an der Baustelle bis zu 30 Minuten je Fahrzeug sind im Preis enthalten. Darüber hinaus werden 1,80 € je angefangener Minute berechnet. Wartezeiten von Pumpe und Kolonne, die der Lieferant zu vertreten hat, trägt der Lieferant.",
    },
    {
      titel: "Preise",
      text: "C25/30 XC2 F3: 128,00 €/m³. C30/37 XC4 WU F3: 139,50 €/m³. Zuschlag Winterbeton unter 5 °C: 6,50 €/m³. Alle Preise netto, frei Baustelle, bis zum 31.12.2027 fest.",
    },
    {
      titel: "Lieferschein und Güteüberwachung",
      text: "Jede Lieferung ist mit einem Lieferschein nach DIN EN 206 zu begleiten. Der Lieferant weist die werkseigene Produktionskontrolle sowie die Fremdüberwachung durch eine anerkannte Überwachungsstelle nach. Frischbetonprüfungen auf der Baustelle bleiben dem Auftraggeber vorbehalten.",
    },
    {
      titel: "Mängelansprüche",
      text: "Mängel am Beton sind unverzüglich nach Entdeckung, spätestens am Lieferdatum, schriftlich anzuzeigen. Der Lieferant ist zur Nacherfüllung verpflichtet. Die Verjährungsfrist beträgt fünf Jahre ab Abnahme des Bauwerks.",
    },
    {
      titel: "Zahlung",
      text: "Rechnungen sind 30 Tage nach Zugang und Prüfung ohne Abzug fällig. Bei Zahlung innerhalb von 14 Tagen gewährt der Lieferant 2 % Skonto.",
    },
    {
      titel: "Haftung und Versicherung",
      text: "Der Lieferant unterhält eine Betriebshaftpflichtversicherung mit einer Deckungssumme von mindestens 5.000.000 € für Personen- und Sachschäden und weist sie auf Verlangen nach.",
    },
    { titel: "Anwendbare Regelwerke", text: VOB },
    { titel: "Schlussbestimmungen", text: `${SCHRIFTFORM} ${GERICHTSSTAND}` },
  ],
  unterschrift:
    "München, 14.10.2026 · Musterbau GmbH (Bauleitung) · Isar Transportbeton GmbH (Geschäftsführung)",
};

export const PUMPEN_VERTRAG: Vertrag = {
  kopf: [
    "Mietvertrag Nr. MV-2026-0187",
    "vom 02.11.2026",
    "Mieter: Musterbau GmbH, Leopoldstraße 112, 80802 München",
    "Vermieter: Brandl Betonpumpen GmbH, Industrieweg 21, 85435 Erding",
    "Bauvorhaben: Wohnanlage Lindenhof, Haus B",
  ],
  paragraphen: [
    {
      titel: "Mietgegenstand",
      text: "Der Vermieter überlässt dem Mieter eine Autobetonpumpe 36 m (Fahrgestell 4-achsig) mit Maschinist und Rohrleitungsmaterial für die Betonagen der Kellerwände und Decken.",
    },
    {
      titel: "Mietzeit und Einsatztage",
      text: "Das Gerät wird nach Abruf an einzelnen Einsatztagen bereitgestellt. Der Abruf erfolgt durch die Bauleitung mindestens 48 Stunden vor dem Einsatz. Eine Stornierung ist bis 24 Stunden vorher kostenfrei.",
    },
    {
      titel: "Vergütung",
      text: "Der Stundensatz beträgt 148,00 € netto je Betriebsstunde, mindestens 4 Stunden je Einsatztag. Die An- und Abfahrt wird pauschal mit 320,00 € je Einsatz berechnet. Zusätzlich 3,20 € je m³ geförderten Beton.",
    },
    {
      titel: "Ausfall und Ersatzgerät",
      text: "Bei einem technischen Ausfall stellt der Vermieter binnen 3 Stunden ein Ersatzgerät mit vergleichbarer Reichweite. Ausfallzeiten werden nicht berechnet. Folgekosten für Wartezeiten der Betonlieferung trägt der Vermieter nur bei grobem Verschulden.",
    },
    {
      titel: "Pflichten des Mieters",
      text: "Der Mieter stellt eine tragfähige, ebene Aufstellfläche sowie ausreichend Abstand zu Baugruben und Freileitungen sicher. Der Standsicherheitsnachweis für die Aufstellfläche liegt bei der Bauleitung.",
    },
    {
      titel: "Maschinist und Arbeitssicherheit",
      text: "Der Maschinist ist weisungsgebunden gegenüber der Bauleitung nur in Bezug auf Einsatzort und -zeit. Die Einhaltung der Unfallverhütungsvorschriften verantwortet der Vermieter.",
    },
    {
      titel: "Reinigung",
      text: "Die Reinigung des Geräts erfolgt auf der Baustelle am dafür vorgesehenen Waschplatz. Das Waschwasser ist über das Absetzbecken zu entsorgen.",
    },
    {
      titel: "Haftung und Versicherung",
      text: "Der Vermieter unterhält eine Maschinen- und Betriebshaftpflichtversicherung. Der Mieter haftet für Schäden am Gerät nur bei Vorsatz oder grober Fahrlässigkeit.",
    },
    { titel: "Schlussbestimmungen", text: `${SCHRIFTFORM} ${GERICHTSSTAND}` },
  ],
  unterschrift:
    "München, 02.11.2026 · Musterbau GmbH · Brandl Betonpumpen GmbH",
};

export const STAHL_VERTRAG: Vertrag = {
  kopf: [
    "Rahmenvertrag Nr. RV-2026-0098",
    "vom 21.09.2026",
    "Auftraggeber: Musterbau GmbH, Leopoldstraße 112, 80802 München",
    "Lieferant: Stahlhandel Obermaier GmbH, Hafenstraße 5, 93055 Regensburg",
    "Bauvorhaben: Wohnanlage Lindenhof, Haus B",
  ],
  paragraphen: [
    {
      titel: "Vertragsgegenstand",
      text: "Der Lieferant liefert Betonstahl BSt 500 S (B500B) als Stabstahl und Matten sowie geschnittene und gebogene Bewehrung nach Biegeplänen des Tragwerksplaners.",
    },
    {
      titel: "Rahmenmenge",
      text: "Die voraussichtliche Gesamtmenge beträgt 148 t. Die Rahmenmenge verpflichtet den Auftraggeber nicht zur Abnahme; Abrufe erfolgen nach Baufortschritt.",
    },
    {
      titel: "Abrufe und Lieferzeit",
      text: "Biegelisten sind spätestens 7 Werktage vor dem gewünschten Liefertermin einzureichen. Die Lieferung erfolgt in Teillieferungen frei Baustelle. Verbindliche Termine werden schriftlich bestätigt.",
    },
    {
      titel: "Freigegebene Pläne",
      text: "Der Lieferant fertigt ausschließlich nach freigegebenen Bewehrungsplänen. Fehlen freigegebene Pläne, verschieben sich Liefertermine ohne Verzugsfolgen für den Lieferanten.",
    },
    {
      titel: "Preise",
      text: "Der Preis richtet sich nach dem Tagespreis des Stahlindexes zum Bestelltag zuzüglich des vereinbarten Verarbeitungszuschlags von 185,00 €/t für Schneiden und Biegen. Preisanpassungen sind dem Auftraggeber vorab anzuzeigen.",
    },
    {
      titel: "Qualitätsnachweise",
      text: "Jeder Lieferung liegen Lieferschein, Übereinstimmungsnachweis (Ü-Zeichen) und Werkszeugnis bei. Die Stäbe sind mit der Herstellerkennzeichnung zu versehen.",
    },
    {
      titel: "Engpass und Ersatzlieferung",
      text: "Droht ein Lieferengpass, informiert der Lieferant den Auftraggeber unverzüglich und benennt Ersatzlieferwege. Mehrkosten für gleichwertige Ersatzbeschaffung trägt der Lieferant.",
    },
    {
      titel: "Mängelansprüche und Zahlung",
      text: "Es gelten die gesetzlichen Mängelrechte. Zahlungen erfolgen innerhalb von 30 Tagen ohne Abzug, bei Zahlung innerhalb von 10 Tagen mit 2 % Skonto.",
    },
    { titel: "Schlussbestimmungen", text: `${SCHRIFTFORM} ${GERICHTSSTAND}` },
  ],
  unterschrift:
    "München, 21.09.2026 · Musterbau GmbH · Stahlhandel Obermaier GmbH",
};

export const ROHBAU_VERTRAG: Vertrag = {
  kopf: [
    "Nachunternehmervertrag Nr. NU-2026-0031",
    "vom 03.08.2026",
    "Auftraggeber: Musterbau GmbH, Leopoldstraße 112, 80802 München",
    "Auftragnehmer: Kessler Rohbau GmbH & Co. KG, Dorfstraße 14, 85386 Eching",
    "Bauvorhaben: Wohnanlage Lindenhof, Haus B (Bauherr: Lindenhof Wohnbau GmbH)",
  ],
  paragraphen: [
    {
      titel: "Vertragsgegenstand",
      text: "Der Auftragnehmer führt die Stahlbetonarbeiten für Haus B aus: Bodenplatte, Kellerwände (weiße Wanne), Decken und Treppenhaus einschließlich Schalung und Bewehrung.",
    },
    {
      titel: "Vertragsgrundlagen",
      text: "Es gelten in dieser Reihenfolge: dieser Vertrag, das Leistungsverzeichnis vom 15.07.2026, der Terminplan Rev. 3, die VOB/B und die VOB/C.",
    },
    {
      titel: "Vergütung",
      text: "Pauschalpreis 1.248.000,00 € netto. Mengenänderungen werden nach Einheitspreisen des Leistungsverzeichnisses abgerechnet. Nachträge sind vor Ausführung schriftlich anzukündigen.",
    },
    {
      titel: "Termine",
      text: "Beginn Erdarbeiten Übergabe: 02.11.2026. Fertigstellung Untergeschoss: 18.12.2026. Fertigstellung Rohbau: 19.03.2027. Die Zwischenfrist Untergeschoss ist Vertragsfrist.",
    },
    {
      titel: "Vertragsstrafe",
      text: "Bei Überschreitung einer Vertragsfrist beträgt die Vertragsstrafe 0,2 % der Netto-Auftragssumme je Werktag, insgesamt höchstens 5 %.",
    },
    {
      titel: "Behinderung und Bedenken",
      text: "Behinderungen sind unverzüglich schriftlich anzuzeigen (§ 6 Abs. 1 VOB/B). Bedenken gegen die vorgesehene Art der Ausführung oder gegen Vorleistungen anderer Unternehmer sind schriftlich mitzuteilen (§ 4 Abs. 3 VOB/B).",
    },
    {
      titel: "Personal und Arbeitsschutz",
      text: "Der Auftragnehmer setzt ausschließlich eigenes, ordnungsgemäß angemeldetes Personal ein. Der Einsatz weiterer Nachunternehmer bedarf der schriftlichen Zustimmung des Auftraggebers.",
    },
    {
      titel: "Sicherheitsleistung",
      text: "Der Auftraggeber behält 5 % der Abrechnungssumme als Vertragserfüllungssicherheit ein. Der Einbehalt kann durch eine unbefristete Bürgschaft eines deutschen Kreditinstituts abgelöst werden.",
    },
    {
      titel: "Abnahme und Gewährleistung",
      text: "Die förmliche Abnahme erfolgt nach Fertigstellung. Die Gewährleistungsfrist beträgt fünf Jahre ab Abnahme.",
    },
    { titel: "Anwendbare Regelwerke", text: VOB },
    { titel: "Schlussbestimmungen", text: `${SCHRIFTFORM} ${GERICHTSSTAND}` },
  ],
  unterschrift:
    "München, 03.08.2026 · Musterbau GmbH (Projektleitung) · Kessler Rohbau GmbH & Co. KG (Geschäftsführung)",
};

export const TIEFBAU_VERTRAG: Vertrag = {
  kopf: [
    "Rahmenvertrag Nr. RV-2026-0054",
    "vom 24.06.2026",
    "Auftraggeber: Musterbau GmbH, Leopoldstraße 112, 80802 München",
    "Auftragnehmer: Huber Tiefbau GmbH, Gewerbering 3, 85609 Aschheim",
    "Bauvorhaben: Wohnanlage Lindenhof, Haus A und B",
  ],
  paragraphen: [
    {
      titel: "Vertragsgegenstand",
      text: "Der Auftragnehmer führt Baugrubenaushub, Verbau, Wasserhaltung, Arbeitsraumverfüllung und die Herstellung der Grundleitungen aus.",
    },
    {
      titel: "Leistungsumfang",
      text: "Voraussichtlicher Aushub: 4.800 m³ Boden der Klassen 3 bis 5. Die Einordnung abweichender Bodenklassen und Altlasten erfolgt nach Bodengutachten und gemeinsamer Aufnahme.",
    },
    {
      titel: "Unvorhergesehene Funde",
      text: "Stößt der Auftragnehmer auf nicht im Gutachten beschriebene Hindernisse (Altfundamente, Leitungen, Kontaminationen), stellt er die Arbeiten an dieser Stelle ein und zeigt den Fund unverzüglich schriftlich an.",
    },
    {
      titel: "Wasserhaltung",
      text: "Die Wasserhaltung erfolgt nach genehmigtem Konzept. Der Grundwasserstand wird wöchentlich gemessen und dokumentiert. Abweichungen vom Bemessungswasserstand sind sofort zu melden.",
    },
    {
      titel: "Vergütung",
      text: "Abrechnung nach Einheitspreisen laut Preisblatt. Stundenlohnarbeiten sind nur nach schriftlicher Anordnung zulässig und zeitnah durch Stundenzettel zu belegen.",
    },
    {
      titel: "Termine",
      text: "Aushub Haus B: bis 30.10.2026. Verbau und Wasserhaltung bleiben bis zur Fertigstellung der Bodenplatte in Betrieb. Spätere Arbeitsraumverfüllung nach Abstimmung mit der Bauleitung.",
    },
    {
      titel: "Nachträge",
      text: "Mehr- und Minderleistungen sowie geänderte Leistungen sind nach § 2 VOB/B zu vergüten. Der Auftragnehmer kündigt Mehrkosten vor Ausführung an.",
    },
    { titel: "Anwendbare Regelwerke", text: VOB },
    { titel: "Schlussbestimmungen", text: `${SCHRIFTFORM} ${GERICHTSSTAND}` },
  ],
  unterschrift: "München, 24.06.2026 · Musterbau GmbH · Huber Tiefbau GmbH",
};
