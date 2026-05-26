import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  getCreditCostsForRegion,
  getStoredPricingRegion,
  setStoredPricingRegion,
} from "./pricingRegions";

const PricingCtx = createContext(null);

export function PricingProvider({ children }) {
  const [region, setRegion] = useState(() => getStoredPricingRegion() || "intl");
  const [country, setCountry] = useState("");
  const [label, setLabel] = useState("");
  const [checkoutNote, setCheckoutNote] = useState("");
  const [currency, setCurrency] = useState("eur");
  const [symbol, setSymbol] = useState("€");
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const stored = getStoredPricingRegion();
      const { data } = await api.get("/public/pricing", {
        headers: stored ? { "X-Pricing-Region": stored } : {},
      });
      const r = data?.region === "usd" ? "usd" : "intl";
      setRegion(r);
      setCountry(data?.country || "");
      setLabel(data?.label || "");
      setCheckoutNote(data?.checkout_note || "");
      setCurrency(data?.currency || "eur");
      setSymbol(data?.symbol || "€");
      setStoredPricingRegion(r);
    } catch {
      const fallback = getStoredPricingRegion() || "intl";
      setRegion(fallback);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const costs = useMemo(() => getCreditCostsForRegion(region), [region]);

  const value = useMemo(
    () => ({
      region,
      country,
      label,
      checkoutNote,
      currency,
      symbol,
      costs,
      ready,
      refresh,
    }),
    [region, country, label, checkoutNote, currency, symbol, costs, ready, refresh]
  );

  return <PricingCtx.Provider value={value}>{children}</PricingCtx.Provider>;
}

export function usePricing() {
  const ctx = useContext(PricingCtx);
  if (!ctx) {
    return {
      region: getStoredPricingRegion() || "intl",
      country: "",
      label: "",
      checkoutNote: "",
      currency: "eur",
      symbol: "€",
      costs: getCreditCostsForRegion(getStoredPricingRegion() || "intl"),
      ready: true,
      refresh: async () => {},
    };
  }
  return ctx;
}
