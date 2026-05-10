import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/email";
import { formatKRW } from "@/lib/tax";

const ItemSchema = z.object({
  foremanId: z.string().optional().nullable(),
  foremanName: z.string(),
  rrnLast7: z.string().optional().nullable(),
  workDays: z.number().int().nonnegative(),
  grossPay: z.number().nonnegative(),
  incomeTax: z.number().nonnegative(),
  localTax: z.number().nonnegative(),
  pension: z.number().nonnegative(),
  health: z.number().nonnegative(),
  employment: z.number().nonnegative(),
  industrial: z.number().nonnegative().optional().default(0),
  netPay: z.number(),
  edited: z.boolean().optional(),
});

const Schema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.enum(["DAILY_LABOR", "BUSINESS_INCOME"]),
  recipient: z.string().email(),
  notes: z.string().optional().nullable(),
  items: z.array(ItemSchema),
});

const TYPE_LABEL: Record<string, string> = {
  DAILY_LABOR: "일용직 신고",
  BUSINESS_INCOME: "사업소득 신고 (3.3%)",
};

function buildHtml(yearMonth: string, type: string, items: any[], notes: string | null) {
  const totals = items.reduce(
    (s, i) => {
      s.grossPay += i.grossPay;
      s.incomeTax += i.incomeTax;
      s.localTax += i.localTax;
      s.pension += i.pension;
      s.health += i.health;
      s.employment += i.employment;
      s.netPay += i.netPay;
      return s;
    },
    { grossPay: 0, incomeTax: 0, localTax: 0, pension: 0, health: 0, employment: 0, netPay: 0 }
  );
  const rows = items
    .map(
      (it: any) => `
      <tr>
        <td>${escape(it.foremanName)}</td>
        <td>${escape(it.rrnLast7 ?? "")}</td>
        <td style="text-align:right">${it.workDays}</td>
        <td style="text-align:right">${formatKRW(it.grossPay)}</td>
        <td style="text-align:right">${formatKRW(it.incomeTax)}</td>
        <td style="text-align:right">${formatKRW(it.localTax)}</td>
        <td style="text-align:right">${formatKRW(it.pension)}</td>
        <td style="text-align:right">${formatKRW(it.health)}</td>
        <td style="text-align:right">${formatKRW(it.employment)}</td>
        <td style="text-align:right;font-weight:bold">${formatKRW(it.netPay)}</td>
      </tr>`
    )
    .join("");
  return `
  <div style="font-family:system-ui,Apple SD Gothic Neo,sans-serif;color:#111">
    <h2>${escape(TYPE_LABEL[type])} 자료 (${escape(yearMonth)})</h2>
    ${notes ? `<p style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${escape(notes)}</p>` : ""}
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="text-align:left;padding:6px">반장</th>
          <th style="text-align:left;padding:6px">주민(뒤7)</th>
          <th style="text-align:right;padding:6px">근무일</th>
          <th style="text-align:right;padding:6px">지급액</th>
          <th style="text-align:right;padding:6px">소득세</th>
          <th style="text-align:right;padding:6px">지방세</th>
          <th style="text-align:right;padding:6px">국민연금</th>
          <th style="text-align:right;padding:6px">건강</th>
          <th style="text-align:right;padding:6px">고용</th>
          <th style="text-align:right;padding:6px">실수령</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f8fafc;font-weight:bold">
          <td colspan="3" style="text-align:right;padding:6px">합계</td>
          <td style="text-align:right;padding:6px">${formatKRW(totals.grossPay)}</td>
          <td style="text-align:right;padding:6px">${formatKRW(totals.incomeTax)}</td>
          <td style="text-align:right;padding:6px">${formatKRW(totals.localTax)}</td>
          <td style="text-align:right;padding:6px">${formatKRW(totals.pension)}</td>
          <td style="text-align:right;padding:6px">${formatKRW(totals.health)}</td>
          <td style="text-align:right;padding:6px">${formatKRW(totals.employment)}</td>
          <td style="text-align:right;padding:6px">${formatKRW(totals.netPay)}</td>
        </tr>
      </tfoot>
    </table>
    <p style="color:#94a3b8;font-size:12px;margin-top:16px">
      * 노무장 자동 생성 자료입니다. 일부 금액은 관리자에 의해 수정되었을 수 있습니다.
    </p>
  </div>`;
}

function buildCsv(items: any[]) {
  const header = ["반장", "주민뒤7", "근무일", "지급액", "소득세", "지방세", "국민연금", "건강", "고용", "산재", "실수령"];
  const lines = [header.join(",")];
  for (const it of items) {
    lines.push([
      csvEscape(it.foremanName),
      csvEscape(it.rrnLast7 ?? ""),
      it.workDays,
      it.grossPay,
      it.incomeTax,
      it.localTax,
      it.pension,
      it.health,
      it.employment,
      it.industrial ?? 0,
      it.netPay,
    ].join(","));
  }
  return lines.join("\n");
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function escape(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid", detail: parsed.error.flatten() }, { status: 400 });

  const { yearMonth, type, recipient, items, notes } = parsed.data;

  const report = await prisma.taxReport.create({
    data: {
      yearMonth,
      type,
      recipientEmail: recipient,
      notes: notes || null,
      status: "DRAFT",
      items: {
        create: items.map((it) => ({
          foremanName: it.foremanName,
          rrnLast7: it.rrnLast7 ?? null,
          workDays: it.workDays,
          grossPay: it.grossPay,
          incomeTax: it.incomeTax,
          localTax: it.localTax,
          pension: it.pension,
          health: it.health,
          employment: it.employment,
          industrial: it.industrial ?? 0,
          netPay: it.netPay,
          edited: !!it.edited,
        })),
      },
    },
  });

  const html = buildHtml(yearMonth, type, items, notes ?? null);
  const csv = buildCsv(items);
  const filename = `${yearMonth}_${type === "DAILY_LABOR" ? "일용직" : "사업소득"}.csv`;

  let result;
  try {
    result = await sendMail({
      to: recipient,
      subject: `[노무장] ${TYPE_LABEL[type]} 자료 (${yearMonth})`,
      html,
      attachments: [{ filename, content: "﻿" + csv }], // BOM for Excel KR
    });
  } catch (e: any) {
    return NextResponse.json({ error: "메일 발송 실패: " + (e?.message ?? "unknown") }, { status: 500 });
  }

  if (!result.skipped) {
    await prisma.taxReport.update({
      where: { id: report.id },
      data: { status: "SENT", sentAt: new Date() },
    });
  }

  return NextResponse.json({ id: report.id, skipped: result.skipped });
}
