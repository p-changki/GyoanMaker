"use client";

import { useState } from "react";
import ActionQueueSection from "./management/ActionQueueSection";
import OrdersSection from "./management/OrdersSection";
import UsersSection from "./management/UsersSection";

type Section = "orders" | "users";

export default function ManagementTab() {
  const [openSection, setOpenSection] = useState<Section | null>(null);

  const toggleSection = (section: Section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="space-y-6">
      {/* Action Queue — always visible */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Action Queue
        </h2>
        <ActionQueueSection />
      </div>

      {/* Orders Section — collapsible */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("orders")}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>결제</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">주문 관리</span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${openSection === "orders" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>toggle</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openSection === "orders" && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100">
            <OrdersSection />
          </div>
        )}
      </div>

      {/* Users Section — collapsible */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection("users")}
          className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>사용자</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span className="text-sm font-bold text-gray-900">사용자 관리</span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${openSection === "users" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <title>toggle</title>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {openSection === "users" && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100">
            <UsersSection />
          </div>
        )}
      </div>
    </div>
  );
}
