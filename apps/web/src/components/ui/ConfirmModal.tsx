"use client";

import { useCallback, createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}
1
const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state?.resolve(true);
    setState(null);
  }, [state]);

  const handleCancel = useCallback(() => {
    state?.resolve(false);
    setState(null);
  }, [state]);

  const variant = state?.variant ?? "default";
  const confirmBtnClass =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={handleCancel}
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
              >
                <div className="px-6 pt-6 pb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {state.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {state.message}
                  </p>
                </div>

                <div className="flex gap-3 px-6 pb-6 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {state.cancelLabel ?? "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${confirmBtnClass}`}
                  >
                    {state.confirmLabel ?? "Confirm"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
