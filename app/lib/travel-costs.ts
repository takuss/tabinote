import { EXPENSE_CATEGORIES, type ExpenseCategory, type TripRecord } from "@/app/lib/records";
import type { Reservation, ReservationType } from "@/app/lib/reservations";
import type { Transport } from "@/app/lib/transports";

function reservationCategory(type: ReservationType): ExpenseCategory {
  if (type === "宿泊") return "宿泊";
  if (["新幹線・鉄道", "飛行機", "高速バス", "レンタカー", "フェリー"].includes(type)) return "交通";
  if (type === "施設・チケット") return "観光・チケット";
  if (type === "飲食店") return "食事";
  return "その他";
}

export function summarizeMainTravelCosts(
  reservations: Reservation[],
  transports: Transport[],
  records: TripRecord[],
) {
  const amounts = new Map<ExpenseCategory, number>(EXPENSE_CATEGORIES.map((category) => [category, 0]));
  const add = (category: ExpenseCategory, amount: number) => amounts.set(category, (amounts.get(category) ?? 0) + amount);
  let reservationAmount = 0;
  let transportFare = 0;
  let otherExpenses = 0;
  let count = 0;

  for (const reservation of reservations) {
    if (reservation.amount === null) continue;
    reservationAmount += reservation.amount;
    add(reservationCategory(reservation.type), reservation.amount);
    count += 1;
  }

  const reservationsById = new Map(reservations.map((reservation) => [reservation.id, reservation]));
  for (const transport of transports) {
    if (transport.fare === null) continue;
    const linkedReservation = transport.reservationId ? reservationsById.get(transport.reservationId) : undefined;
    if (linkedReservation?.amount !== null && linkedReservation?.amount !== undefined) continue;
    transportFare += transport.fare;
    add("交通", transport.fare);
    count += 1;
  }

  for (const record of records) {
    if (record.amount === null) continue;
    otherExpenses += record.amount;
    add(record.expenseCategory || "その他", record.amount);
    count += 1;
  }

  const total = reservationAmount + transportFare + otherExpenses;
  return {
    total,
    count,
    reservationAmount,
    transportFare,
    otherExpenses,
    categories: EXPENSE_CATEGORIES.map((category) => ({
      category,
      amount: amounts.get(category) ?? 0,
      percentage: total > 0 ? Math.round(((amounts.get(category) ?? 0) / total) * 100) : 0,
    })),
  };
}
