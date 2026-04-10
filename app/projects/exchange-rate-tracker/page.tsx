"use client";
import { getApiBase } from "@/lib/api-config";

import BlogNav from "@/components/BlogNav";
import { useState, useEffect } from "react";

interface Provider {
  name: string;
  rate: number;
  fee: number;
  delivery: string;
  logo: string;
  tag?: string;
}

interface RateData {
  midMarket: number;
  providers: Provider[];
  fetchedAt: string;
  fallback?: boolean;
}

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 0.0001) return;
    const duration = 600;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

export default function ExchangeRateTrackerPage() {
  const [amount, setAmount] = useState(1000);
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [data, setData] = useState<RateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRates = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/exchange-rate`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setError("");
    } catch {
      setError("Failed to fetch rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const rates = data?.providers || [];
  const midMarket = data?.midMarket || 0;
  const selected = rates[selectedProvider];
  const recipientGets = selected ? amount * selected.rate - selected.fee * selected.rate : 0;
  const totalCost = selected ? amount + selected.fee : 0;
  const effectiveRate = totalCost > 0 ? recipientGets / totalCost : 0;
  const bestRate = rates.length > 0 ? Math.max(...rates.map((r) => r.rate)) : 0;

  const fetchedAt = data?.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString() : "";

  const prompt = `Build a USD to INR exchange rate tracker dashboard with:
- Server-side API route fetching live rates from Frankfurter API (ECB data)
- Provider comparison for Wise, Instarem, ICICI Money2India, Remitly, Xoom
- Realistic markup percentages applied to mid-market rate
- 5-minute server-side cache to avoid rate limiting
- Interactive calculator showing recipient amount
- Auto-refresh every 5 minutes on the client
- Side-by-side comparison of rates, fees, delivery times
- Animated number transitions
- Responsive dark theme dashboard`;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <BlogNav />

      {/* Header */}
      <header className="px-6 pt-12 pb-8 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 bg-purple-500/10 text-purple-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE RATES {data?.fallback ? "(CACHED)" : ""}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              USD → INR <span className="text-neutral-400">Exchange Rates</span>
            </h1>
            <p className="mt-2 text-neutral-500 max-w-lg">
              Real-time exchange rates from the European Central Bank. Provider rates estimated with typical markups.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Mid-Market Rate (ECB)</div>
            {loading ? (
              <div className="text-3xl font-mono font-bold text-neutral-600">Loading...</div>
            ) : (
              <>
                <div className="text-3xl font-mono font-bold text-purple-400">
                  ₹<AnimatedNumber value={midMarket} />
                </div>
                <div className="text-xs text-neutral-500 mt-1">Updated {fetchedAt}</div>
              </>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="px-6 pb-16 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-neutral-400">Fetching live exchange rates...</p>
          </div>
        </div>
      ) : error && !data ? (
        <div className="px-6 pb-16 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-300">{error}</p>
            <button onClick={fetchRates} className="mt-4 px-6 py-2 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition">
              Retry
            </button>
          </div>
        </div>
      ) : (
        <main className="px-6 pb-16 max-w-6xl mx-auto space-y-6">
          {/* Calculator */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008H15.75v-.008zm0 2.25h.008v.008H15.75V13.5z" />
              </svg>
              Transfer Calculator
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 block mb-2">You Send</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-mono">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-800 px-4 pl-8 py-4 text-2xl font-mono font-bold text-neutral-200 focus:border-purple-500/50 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-1 rounded bg-purple-500/10 text-purple-400">USD</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(v)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                        amount === v
                          ? "bg-purple-500/20 text-purple-400"
                          : "bg-neutral-800 text-neutral-500 hover:text-white"
                      }`}
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 block mb-2">Recipient Gets</label>
                <div className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-4">
                  <div className="text-2xl font-mono font-bold text-green-400">
                    ₹<AnimatedNumber value={recipientGets} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-neutral-500">via {selected?.name}</span>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-purple-500/10 text-purple-400">INR</span>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>Transfer fee</span>
                    <span className="text-neutral-300">{selected?.fee === 0 ? "FREE" : `$${selected?.fee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective rate</span>
                    <span className="text-neutral-300 font-mono">₹{effectiveRate.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total cost</span>
                    <span className="text-neutral-300 font-mono">${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Provider comparison */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                Provider Comparison
              </h2>
              <button
                onClick={fetchRates}
                className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                    <th className="text-left px-6 py-3 font-medium">Provider</th>
                    <th className="text-right px-6 py-3 font-medium">Exchange Rate</th>
                    <th className="text-right px-6 py-3 font-medium">Fee</th>
                    <th className="text-right px-6 py-3 font-medium">You Get (₹)</th>
                    <th className="text-right px-6 py-3 font-medium">Markup</th>
                    <th className="text-right px-6 py-3 font-medium">Delivery</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((provider, i) => {
                    const gets = amount * provider.rate - provider.fee * provider.rate;
                    const markup = ((midMarket - provider.rate) / midMarket) * 100;
                    const isBest = provider.rate === bestRate;
                    return (
                      <tr
                        key={provider.name}
                        onClick={() => setSelectedProvider(i)}
                        className={`border-b border-neutral-800/50 cursor-pointer transition-colors ${
                          selectedProvider === i ? "bg-purple-500/5" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-sm font-bold">
                              {provider.logo}
                            </div>
                            <div>
                              <div className="font-semibold">{provider.name}</div>
                              {provider.tag && (
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                    provider.tag === "Best Rate"
                                      ? "bg-green-500/15 text-green-400"
                                      : provider.tag === "Fastest"
                                      ? "bg-blue-500/15 text-blue-400"
                                      : "bg-purple-500/15 text-purple-400"
                                  }`}
                                >
                                  {provider.tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          <span className={isBest ? "text-green-400" : "text-neutral-200"}>₹{provider.rate.toFixed(4)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {provider.fee === 0 ? (
                            <span className="text-green-400 text-sm font-medium">FREE</span>
                          ) : (
                            <span className="font-mono text-neutral-400">${provider.fee.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-neutral-200">
                          ₹{gets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-sm ${markup < 0.5 ? "text-green-400" : markup < 1 ? "text-yellow-400" : "text-red-400"}`}>
                            {markup.toFixed(3)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-neutral-500">{provider.delivery}</td>
                        <td className="px-6 py-4 text-right">
                          {selectedProvider === i && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-neutral-800/50">
              {rates.map((provider, i) => {
                const gets = amount * provider.rate - provider.fee * provider.rate;
                const markup = ((midMarket - provider.rate) / midMarket) * 100;
                return (
                  <button
                    key={provider.name}
                    onClick={() => setSelectedProvider(i)}
                    className={`w-full text-left px-6 py-4 transition-colors ${
                      selectedProvider === i ? "bg-purple-500/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">
                          {provider.logo}
                        </div>
                        <div>
                          <span className="font-semibold text-sm">{provider.name}</span>
                          {provider.tag && (
                            <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">
                              {provider.tag}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-sm">₹{gets.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-neutral-500">{provider.delivery}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-neutral-500">
                      <span>Rate: <span className="text-neutral-300 font-mono">₹{provider.rate.toFixed(2)}</span></span>
                      <span>Fee: <span className="text-neutral-300">{provider.fee === 0 ? "FREE" : `$${provider.fee}`}</span></span>
                      <span>Markup: <span className={markup < 0.5 ? "text-green-400" : "text-yellow-400"}>{markup.toFixed(3)}%</span></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rate insight cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Best Rate</div>
              <div className="text-2xl font-mono font-bold text-green-400">₹{bestRate.toFixed(4)}</div>
              <div className="text-xs text-neutral-500 mt-1">{rates.find((r) => r.rate === bestRate)?.name}</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Avg Markup</div>
              <div className="text-2xl font-mono font-bold text-purple-400">
                {rates.length > 0 ? (rates.reduce((s, r) => s + ((midMarket - r.rate) / midMarket) * 100, 0) / rates.length).toFixed(3) : "0.000"}%
              </div>
              <div className="text-xs text-neutral-500 mt-1">vs mid-market rate</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
              <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">Potential Savings</div>
              <div className="text-2xl font-mono font-bold text-green-400">
                ₹{rates.length > 0 ? ((bestRate - Math.min(...rates.map((r) => r.rate))) * amount).toFixed(2) : "0.00"}
              </div>
              <div className="text-xs text-neutral-500 mt-1">best vs worst on ${amount.toLocaleString()}</div>
            </div>
          </div>

          {/* Data source info */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-xs text-neutral-500 leading-relaxed">
            <strong className="text-neutral-400">Data Source:</strong> Mid-market rate from the European Central Bank via Frankfurter API. Provider rates are estimated using typical markup percentages. Fees and delivery times are approximate. Auto-refreshes every 5 minutes. Always verify with the provider before sending money.
          </div>

          {/* Prompt */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-lg font-semibold text-purple-400 mb-3">Built with this prompt</h2>
            <pre className="text-sm text-neutral-300 whitespace-pre-wrap bg-neutral-950 rounded-xl p-4 border border-neutral-800">{prompt}</pre>
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={() => navigator.clipboard.writeText(prompt)}
                className="text-sm text-purple-400 hover:text-purple-300 transition"
              >
                Copy prompt
              </button>
              <a href="/tools/project-starter" className="text-sm text-neutral-500 hover:text-white transition">
                Try in Project Starter →
              </a>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
