import type { Procurement } from "@prisma/client";

export function serializeProcurement<T extends Procurement>(procurement: T) {
  return {
    ...procurement,
    unitPrice: Number(procurement.unitPrice),
    totalPrice: Number(procurement.totalPrice),
  };
}
