import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function WhatsAppButton({
  phone,
  message = "",
  className = "",
}: WhatsAppButtonProps) {
  const formattedPhone = formatPhone(phone);
  const url = message
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${formattedPhone}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe57] text-white font-medium rounded-lg transition ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      WhatsApp
    </a>
  );
}
