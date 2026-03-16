import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = {
  title: 'Integritetspolicy - ForFor',
  description: 'Information om hur ForFor hanterar personuppgifter enligt GDPR',
}

export default function IntegritetspolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="text-green-700 hover:underline text-sm"
        >
          &larr; Tillbaka till startsidan
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-green-700">
              Integritetspolicy
            </CardTitle>
            <p className="text-sm text-gray-500">
              Senast uppdaterad: 2026-03-16
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-lg font-semibold">1. Vilka vi är</h2>
              <p>
                ForFor är en tjänst för föreningsförsäljning som hjälper svenska
                sportklubbar att hantera door-to-door-kampanjer. Tjänsten
                tillhandahålls av organisationen som administrerar din förening.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                2. Vilka personuppgifter samlar vi in?
              </h2>
              <p>Vi behandlar följande personuppgifter:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Kunduppgifter:</strong> namn, telefonnummer,
                  e-postadress och leveransadress (gatuadress, postnummer, ort).
                </li>
                <li>
                  <strong>Beställningshistorik:</strong> vilka produkter som
                  beställts, belopp och betalningsstatus.
                </li>
                <li>
                  <strong>Användarkonton:</strong> namn, e-post, telefonnummer,
                  användarnamn och roll i systemet (admin, lagmedlem).
                </li>
                <li>
                  <strong>Adressbesök:</strong> besöksresultat och eventuella
                  anteckningar kopplade till adresser.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                3. Varför behandlar vi personuppgifter?
              </h2>
              <p>Vi behandlar personuppgifter för att:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Hantera och genomföra föreningsförsäljningskampanjer.
                </li>
                <li>
                  Administrera beställningar och leveranser till kunder.
                </li>
                <li>
                  Möjliggöra inloggning och behörighetshantering för
                  föreningsmedlemmar och administratörer.
                </li>
                <li>
                  Uppfylla bokföringskrav enligt svensk lag (Bokföringslagen).
                </li>
              </ul>
              <p>
                Den rättsliga grunden för behandlingen är fullgörande av avtal
                (beställningar), berättigat intresse (kampanjhantering) samt
                rättslig förpliktelse (bokföring).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                4. Hur länge sparas uppgifterna?
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Beställningar och transaktionsdata:</strong> sparas i
                  7 år i enlighet med Bokföringslagen (1999:1078).
                </li>
                <li>
                  <strong>Kundkontaktuppgifter</strong> (namn, telefon, e-post):
                  raderas efter att kampanjen avslutats, om kunden inte har
                  aktiva beställningar.
                </li>
                <li>
                  <strong>Användarkonton:</strong> sparas så länge kontot är
                  aktivt. Inaktiva konton raderas efter överenskommelse med
                  föreningen.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">5. Dina rättigheter</h2>
              <p>Enligt GDPR har du rätt att:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Få tillgång</strong> till de personuppgifter vi har om
                  dig.
                </li>
                <li>
                  <strong>Begära rättelse</strong> av felaktiga uppgifter.
                </li>
                <li>
                  <strong>Begära radering</strong> av dina uppgifter (med
                  undantag för uppgifter som måste sparas enligt lag).
                </li>
                <li>
                  <strong>Begära dataportabilitet</strong> — att få dina
                  uppgifter exporterade i ett maskinläsbart format.
                </li>
                <li>
                  <strong>Invända</strong> mot behandling som grundar sig på
                  berättigat intresse.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">6. Kontakt</h2>
              <p>
                Om du vill utöva dina rättigheter eller har frågor om hur vi
                hanterar dina personuppgifter, vänligen kontakta oss via
                föreningens kontaktuppgifter. Du har även rätt att lämna klagomål
                till Integritetsskyddsmyndigheten (IMY) om du anser att dina
                personuppgifter behandlas i strid med GDPR.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">
                7. Tekniska och organisatoriska åtgärder
              </h2>
              <p>
                Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att
                skydda dina personuppgifter, inklusive krypterad datalagring,
                behörighetskontroll och säker inloggning.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
