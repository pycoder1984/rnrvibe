import { NextResponse } from "next/server";

const PROVIDER_CONFIG = [
  { name: "Wise", markup: 0.0017, fee: 4.14, delivery: "1-2 hours", logo: "W", tag: "Best Rate" },
  { name: "Instarem", markup: 0.0032, fee: 3.99, delivery: "1 business day", logo: "I" },
  { name: "Western Union", markup: 0.0130, fee: 0, delivery: "Minutes", logo: "WU" },
  { name: "Remitly", markup: 0.0056, fee: 3.99, delivery: "Minutes", logo: "R", tag: "Fastest" },
  { name: "ICICI Money2India", markup: 0.0095, fee: 0, delivery: "Same day", logo: "IC", tag: "No Fee" },
  { name: "Xoom (PayPal)", markup: 0.0115, fee: 0, delivery: "1-3 business days", logo: "X" },
  { name: "Remitout", markup: 0.0025, fee: 2.99, delivery: "1-2 business days", logo: "RO" },
  { name: "SBI Remit", markup: 0.0088, fee: 5.00, delivery: "1 business day", logo: "SBI" },
  { name: "MoneyGram", markup: 0.0140, fee: 0, delivery: "10 minutes", logo: "MG" },
  { name: "OFX", markup: 0.0040, fee: 0, delivery: "1-2 business days", logo: "OFX", tag: "No Fee" },
];

let cachedData: { midMarket: number; providers: typeof PROVIDER_CONFIG & { rate: number }[]; fetchedAt: string } | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const now = Date.now();

  if (cachedData && now - cacheTime < CACHE_DURATION) {
    return NextResponse.json(cachedData);
  }

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=INR", {
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error("API request failed");

    const data = await res.json();
    const midMarket = data.rates.INR;

    const providers = PROVIDER_CONFIG.map((p) => ({
      ...p,
      rate: parseFloat((midMarket * (1 - p.markup)).toFixed(4)),
    }));

    cachedData = {
      midMarket,
      providers,
      fetchedAt: new Date().toISOString(),
    };
    cacheTime = now;

    return NextResponse.json(cachedData);
  } catch {
    // Fallback if API is down
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const fallbackMid = 83.92;
    return NextResponse.json({
      midMarket: fallbackMid,
      providers: PROVIDER_CONFIG.map((p) => ({
        ...p,
        rate: parseFloat((fallbackMid * (1 - p.markup)).toFixed(4)),
      })),
      fetchedAt: new Date().toISOString(),
      fallback: true,
    });
  }
}
