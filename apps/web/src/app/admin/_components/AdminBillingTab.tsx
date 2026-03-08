"use client";

import BillingSummary from "./BillingSummary";
import OrdersTable from "./OrdersTable";

export default function AdminBillingTab() {
  return (
    <div className="space-y-6">
      <BillingSummary />
      <OrdersTable />
    </div>
  );
}
