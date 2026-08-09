import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Send, Link, Sparkles } from 'lucide-react';
import { openWhatsApp, cleanPhoneNumber } from '../utils/whatsapp';

interface ShareMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappPhone: string;
  storeName: string;
}

export const ShareMenuModal: React.FC<ShareMenuModalProps> = ({
  isOpen,
  onClose,
  whatsappPhone,
  storeName,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [clientPhone, setClientPhone] = useState('');

  if (!isOpen) return null;

  // Base URL with parameter to ensure customer mode
  const currentUrl = window.location.href.split('?')[0] + '?mode=cliente';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const inviteMessage = `🧼 *${storeName.toUpperCase()}*\n\nOlá! Para agendar a lavagem do seu veículo, escolha o tipo de lavagem, adicionais e o melhor horário no nosso cardápio digital:\n\n👉 ${currentUrl}\n\nApós preencher, seu agendamento será enviado automaticamente para nosso WhatsApp! 🚗✨`;

  const handleSendLinkToClient = () => {
    openWhatsApp(clientPhone || '', inviteMessage);
  };

  const bioText = `🧼 ${storeName}\n✨ Agende sua lavagem online em 1 minuto!\n👇 Clique no link e monte seu pedido:\n${currentUrl}`;

  const handleCopyBioText = () => {
    navigator.clipboard.writeText(bioText);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#18181c] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1c2733] to-[#121921] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg">
                Link de Agendamento do Cliente
              </h3>
              <p className="text-xs text-cyan-200/70">
                Envie para o cliente preencher os dados e agendar pelo WhatsApp
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Main feature highlight */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Como funciona o Link do Cliente?</span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Você compartilha o link abaixo com o cliente. Ele escolhe o carro, o tipo de lavagem, o dia e o horário. Quando ele clicar em <strong>"Finalizar"</strong>, a mensagem preenchida será enviada direto para o WhatsApp do seu Lava Jato!
            </p>
          </div>

          {/* Direct Send via WhatsApp to a specific client */}
          <div className="p-4 rounded-xl bg-[#121215] border border-gray-800 space-y-3">
            <label className="block text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              Enviar Link direto para o WhatsApp do Cliente:
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="DDD + Telefone (ex: 94991234567) ou opcional"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1a1a20] border border-gray-700 text-white placeholder-gray-500 text-xs focus:border-cyan-400 focus:outline-none"
              />
              <button
                onClick={handleSendLinkToClient}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar no Whats</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              * Se deixar o campo em branco, abrirá o seu WhatsApp para você escolher o contato.
            </p>
          </div>

          {/* Copy Direct Link */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Link Direto do Cardápio:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#121215] border border-gray-700 text-cyan-300 font-mono text-xs focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instagram Bio Text snippet */}
          <div className="p-3.5 rounded-xl bg-[#121215] border border-gray-800 space-y-2">
            <span className="text-xs font-bold text-gray-200 block">
              📸 Modelo de Texto para Bio do Instagram ou Status:
            </span>
            <div className="p-2.5 rounded-lg bg-[#1a1a20] text-[11px] text-gray-300 font-mono whitespace-pre-line border border-gray-800">
              {bioText}
            </div>
            <button
              onClick={handleCopyBioText}
              className="w-full py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedBio ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Texto Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copiar Texto para Bio</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

