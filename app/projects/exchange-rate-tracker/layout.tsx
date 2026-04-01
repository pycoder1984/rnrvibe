export const metadata = {
  title: "USD to INR Exchange Rate Tracker — RnR Vibe",
  description: "Real-time USD to INR exchange rate comparison across Wise, Instarem, ICICI Money2India, Remitly, and Xoom. Interactive calculator with live rates.",
  alternates: { canonical: "https://www.rnrvibe.com/projects/exchange-rate-tracker" },
  openGraph: {
    title: "USD to INR Exchange Rate Tracker — RnR Vibe",
    description: "Compare real-time exchange rates across major providers. Built with vibecoding.",
    images: ["/api/og?title=USD%20to%20INR%20Rate%20Tracker&type=article"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
