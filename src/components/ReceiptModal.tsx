import React, { useState } from 'react';
import { Appointment, StoreSettings } from '../types';
import { buildReceiptMessage, openWhatsApp, formatBRL } from '../utils/whatsapp';
import { X, MessageCircle, Copy, Check, Printer, Sparkles, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  settings: StoreSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  appointment,
  settings,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !appointment) return null;

  const rawMsg = buildReceiptMessage(
    appointment,
    settings.storeName,
    settings.whatsappPhone
  );

  const isClientCreated = appointment.createdBy === 'cliente';

  const handleSendWhatsApp = () => {
    // If created by client, send directly to the store/company WhatsApp phone
    // If created by staff, send to customer's phone or store phone
    const targetPhone = isClientCreated
      ? settings.whatsappPhone
      : appointment.customerPhone || settings.whatsappPhone;

    openWhatsApp(targetPhone, rawMsg);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rawMsg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = appointment.date.split('-').reverse().join('/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#18181c] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-[#182622] to-[#141d1a] border-b border-emerald-500/30 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isClientCreated ? 'Agendamento Confirmado!' : 'Comprovante de Agendamento'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                {isClientCreated
                  ? 'O comprovante foi preparado para envio no WhatsApp'
                  : 'Gerado com sucesso para o cliente'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Voucher Body (Ticket style) */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Banner for client */}
          {isClientCreated && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Agendamento registrado! Clique no botão abaixo para abrir a conversa no WhatsApp do Lava Jato.
              </span>
            </div>
          )}
          <div className="p-5 rounded-2xl bg-[#121215] border border-emerald-500/30 space-y-4 text-xs font-mono shadow-inner relative overflow-hidden print:bg-white print:text-black print:border-black">
            {/* Stamp / Decorative background */}
            <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full border-4 border-emerald-500/10 flex items-center justify-center text-[10px] font-black tracking-widest text-emerald-500/20 rotate-[-20deg] pointer-events-none select-none">
              CONFIRMADO
            </div>

            {/* Ticket Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-700">
              <div className="font-sans font-black text-base text-cyan-300 tracking-wide uppercase">
                {settings.storeName}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {settings.address} • Tel: {settings.whatsappPhone}
              </div>
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-sans font-extrabold text-xs">
                {appointment.code}
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-1 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Cliente:</span>
                <span className="font-bold text-white">{appointment.customerName}</span>
              </div>
              {appointment.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Telefone:</span>
                  <span className="text-gray-200">{appointment.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Veículo:</span>
                <span className="font-bold text-white">
                  {appointment.vehicleName} ({appointment.carModel})
                </span>
              </div>
              {appointment.carPlate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Placa:</span>
                  <span className="font-bold text-amber-300">
                    {appointment.carPlate.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Scheduled Date/Time */}
            <div className="p-2.5 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
              <div className="flex justify-between font-sans">
                <span className="text-gray-400">Data Agendada:</span>
                <span className="font-bold text-emerald-300">{formattedDate}</span>
              </div>
              <div className="flex justify-between font-sans">
                <span className="text-gray-400">Horário:</span>
                <span className="font-bold text-emerald-300">{appointment.timeSlot}</span>
              </div>
            </div>

            {/* Service & Extras */}
            <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-700">
              <div className="text-[11px] text-gray-400 font-sans font-semibold">
                SERVIÇO PRINCIPAL:
              </div>
              <div className="font-bold text-white text-sm">{appointment.washName}</div>

              {appointment.extraNames && appointment.extraNames.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] text-gray-400 font-sans font-semibold mb-1">
                    ADICIONAIS:
                  </div>
                  <ul className="space-y-0.5 text-gray-300">
                    {appointment.extraNames.map((ex, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-emerald-400">+</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {appointment.materialNames && appointment.materialNames.length > 0 && (
                <div className="pt-1">
                  <div className="text-[11px] text-gray-400 font-sans font-semibold mb-1">
                    MATERIAIS DA LOJINHA:
                  </div>
                  <ul className="space-y-0.5 text-gray-300">
                    {appointment.materialNames.map((m, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-cyan-400">🛍️</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Total price */}
            <div className="pt-3 border-t border-dashed border-gray-700 flex items-center justify-between">
              <span className="font-sans font-extrabold text-sm text-gray-300">
                VALOR TOTAL:
              </span>
              <span className="font-sans font-black text-xl text-emerald-300">
                {formatBRL(appointment.totalPrice)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 space-y-2 print:hidden">
          <button
            onClick={handleSendWhatsApp}
            id="btn-send-whatsapp-receipt"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-current shrink-0" />
            <span>
              {isClientCreated
                ? 'Enviar Agendamento para WhatsApp do Lava Jato'
                : 'Enviar Comprovante ao Cliente no WhatsApp'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Imprimir Recibo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
