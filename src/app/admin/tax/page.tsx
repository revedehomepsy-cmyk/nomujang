import TaxClient from "./TaxClient";
import { DEFAULT_RATES } from "@/lib/tax";

export const dynamic = "force-dynamic";

export default function TaxPage() {
  return <TaxClient defaultRates={DEFAULT_RATES} />;
}
