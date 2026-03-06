"use client";

import MockPaymentModal from "./MockPaymentModal";

interface PaymentGatewayProps {
  open: boolean;
  title: string;
  amount: number;
  processing: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function PaymentGateway(props: PaymentGatewayProps) {
  return <MockPaymentModal {...props} />;
}
