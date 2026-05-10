/**
 * 한국 일용직/사업소득 세금 및 4대보험 표준 계산 모듈.
 * 실제 신고 시에는 세무사와 최종 확인 후 사용해야 한다.
 *
 * 기본 가정 (2026년 기준 표준):
 *  - 일용직 소득세: (일급 - 150,000) * 6% * (1 - 55%) = 일급 초과분의 2.7%
 *    → 즉 일급 187,000원까지는 소액부징수로 0원, 그 이상부터 부과.
 *  - 지방소득세: 소득세의 10%
 *  - 사업소득 원천징수: 지급액의 3% (지방세 0.3% 포함 시 3.3%)
 *  - 4대보험 (일용직, 사업주 부담분 제외 근로자 부담분 기준):
 *      국민연금: 일용직(월 8일 미만, 월 60시간 미만, 1개월 미만) 면제
 *      건강보험: 1개월 미만 일용직 면제
 *      고용보험: 0.9% (근로자 부담)
 *      산재보험: 100% 사업주 부담 (근로자 부담 0)
 *
 *  본 모듈에서는 일용직 신고를 "1개월 미만 근로"로 가정하여 국민연금/건강보험은 0,
 *  고용보험만 0.9% 차감을 기본값으로 둔다. 관리자 화면에서 임의로 수정 가능하다.
 */

export interface TaxRates {
  // 일용직
  dailyDeduction: number; // 일 공제액 (기본 150,000)
  dailyIncomeTaxRate: number; // 0.027 (2.7%)
  localTaxRate: number; // 소득세 대비 (기본 0.1)
  petitTaxThreshold: number; // 소액부징수 기준 (소득세 1000원 미만 시 면제)
  // 4대보험 (일용직 근로자 부담)
  pensionRate: number; // 0
  healthRate: number; // 0
  employmentRate: number; // 0.009
  industrialRate: number; // 0 (사업주 부담)
  // 사업소득
  businessIncomeRate: number; // 0.03
  businessLocalRate: number; // 0.003
}

export const DEFAULT_RATES: TaxRates = {
  dailyDeduction: 150_000,
  dailyIncomeTaxRate: 0.027,
  localTaxRate: 0.1,
  petitTaxThreshold: 1_000,
  pensionRate: 0,
  healthRate: 0,
  employmentRate: 0.009,
  industrialRate: 0,
  businessIncomeRate: 0.03,
  businessLocalRate: 0.003,
};

export interface DailyLaborInput {
  grossPay: number; // 총 지급액
  workDays: number; // 근무일수
}

export interface CalcResult {
  grossPay: number;
  incomeTax: number;
  localTax: number;
  pension: number;
  health: number;
  employment: number;
  industrial: number;
  totalDeduction: number;
  netPay: number;
}

const round = (n: number) => Math.round(n);

/** 일용직 신고 기준 계산 */
export function calcDailyLabor(input: DailyLaborInput, rates: TaxRates = DEFAULT_RATES): CalcResult {
  const { grossPay, workDays } = input;
  const dailyAvg = workDays > 0 ? grossPay / workDays : 0;
  const taxableDaily = Math.max(0, dailyAvg - rates.dailyDeduction);
  let incomeTaxPerDay = taxableDaily * rates.dailyIncomeTaxRate;
  // 소액부징수 (일별 소득세가 1000원 미만이면 면제)
  if (incomeTaxPerDay < rates.petitTaxThreshold) incomeTaxPerDay = 0;
  const incomeTax = round(incomeTaxPerDay * workDays);
  const localTax = round(incomeTax * rates.localTaxRate);

  const pension = round(grossPay * rates.pensionRate);
  const health = round(grossPay * rates.healthRate);
  const employment = round(grossPay * rates.employmentRate);
  const industrial = round(grossPay * rates.industrialRate);

  const totalDeduction = incomeTax + localTax + pension + health + employment;
  const netPay = round(grossPay - totalDeduction);

  return {
    grossPay: round(grossPay),
    incomeTax,
    localTax,
    pension,
    health,
    employment,
    industrial,
    totalDeduction,
    netPay,
  };
}

/** 사업소득 신고 기준 계산 (3.3% 원천징수) */
export function calcBusinessIncome(grossPay: number, rates: TaxRates = DEFAULT_RATES): CalcResult {
  const incomeTax = round(grossPay * rates.businessIncomeRate);
  const localTax = round(grossPay * rates.businessLocalRate);
  const totalDeduction = incomeTax + localTax;
  return {
    grossPay: round(grossPay),
    incomeTax,
    localTax,
    pension: 0,
    health: 0,
    employment: 0,
    industrial: 0,
    totalDeduction,
    netPay: round(grossPay - totalDeduction),
  };
}

export function compareReports(input: DailyLaborInput, rates: TaxRates = DEFAULT_RATES) {
  const daily = calcDailyLabor(input, rates);
  const business = calcBusinessIncome(input.grossPay, rates);
  return {
    daily,
    business,
    diffNetPay: daily.netPay - business.netPay,
    diffDeduction: daily.totalDeduction - business.totalDeduction,
  };
}

export function formatKRW(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n));
}
