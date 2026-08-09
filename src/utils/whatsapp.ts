import { Appointment, StoreSettings } from '../types';

export function formatBRL(amount: number): string {
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Clean phone number to standard international WhatsApp format
 */
export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  // If user entered without country code (e.g. 94999999999 or 999999999), add 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

/**
 * Builds the text voucher / receipt (Comprovante) for WhatsApp
 */
export function buildReceiptMessage(
  apt: Appointment,
  storeName: string,
  storePhone: string
): string {
  const formattedDate = apt.date.split('-').reverse().join('/');

  let msg = `🧼 *COMPROVANTE DE AGENDAMENTO - ${storeName.toUpperCase()}* 🧼\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🎟️ *Comprovante Nº:* ${apt.code}\n`;
  msg += `📅 *Data Agendada:* ${formattedDate} às ${apt.timeSlot}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `👤 *Cliente:* ${apt.customerName}\n`;
  if (apt.customerPhone) {
    msg += `📞 *Telefone:* ${apt.customerPhone}\n`;
  }
  msg += `🚗 *Veículo:* ${apt.vehicleName} - ${apt.carModel}${
    apt.carColor ? ` (${apt.carColor})` : ''
  }\n`;
  if (apt.carPlate) {
    msg += `🔢 *Placa:* ${apt.carPlate.toUpperCase()}\n`;
  }

  msg += `\n🧼 *Serviço Escolhido:* ${apt.washName}\n`;

  if (apt.extraNames && apt.extraNames.length > 0) {
    msg += `➕ *Serviços Adicionais:*\n`;
    apt.extraNames.forEach((ex) => {
      msg += `   • ${ex}\n`;
    });
  }

  if (apt.deliveryOption) {
    msg += `🚚 *Serviço Leva e Traz:* Ativado\n`;
    if (apt.address) {
      msg += `📍 *Endereço de Busca:* ${apt.address}\n`;
    }
  }

  if (apt.notes) {
    msg += `📝 *Observações:* ${apt.notes}\n`;
  }

  msg += `\n💰 *VALOR TOTAL:* ${formatBRL(apt.totalPrice)}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `✅ *STATUS:* ${apt.status === 'aprovado' ? 'Confirmado e Aprovado' : 'Recebido — Aguardando Confirmação'}\n\n`;
  msg += `Obrigado por escolher o *${storeName}*! Dúvidas? Fale conosco no WhatsApp ${storePhone}.`;

  return msg;
}

/**
 * Builds notification for when the car is finished and ready for pickup
 */
export function buildReadyMessage(apt: Appointment, storeName: string): string {
  let msg = `✨ *SEU VEÍCULO ESTÁ PRONTO!* ✨\n`;
  msg += `📍 *${storeName}*\n\n`;
  msg += `Olá, *${apt.customerName}*!\n`;
  msg += `Seu veículo *${apt.carModel}* (${apt.vehicleName}) já foi concluído e está limpo e cheiroso aguardando você! 🚗✨\n\n`;
  msg += `💳 *Valor Final:* ${formatBRL(apt.totalPrice)}\n`;
  msg += `🎟️ *Pedido:* ${apt.code}\n\n`;
  msg += `Pode vir retirar quando quiser ou aguarde caso tenha solicitado o Leva e Traz!`;
  return msg;
}

/**
 * Builds a short confirmation message sent to the client when their
 * appointment is approved by the staff
 */
export function buildApprovalMessage(apt: Appointment, storeName: string): string {
  const formattedDate = apt.date.split('-').reverse().join('/');
  let msg = `✅ Olá, *${apt.customerName}*!\n`;
  msg += `Seu agendamento no *${storeName}* foi *APROVADO*!\n\n`;
  msg += `📅 *${formattedDate}* às *${apt.timeSlot}*\n`;
  msg += `🚗 ${apt.carModel} (${apt.vehicleName})\n`;
  msg += `🧼 ${apt.washName}\n`;
  msg += `💰 ${formatBRL(apt.totalPrice)}\n\n`;
  msg += `Aguardamos você! 🚿✨`;
  return msg;
}

/**
 * Opens WhatsApp url with custom text message
 */
export function openWhatsApp(phone: string, textMessage: string): void {
  const cleanNum = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(textMessage);
  const url = cleanNum ? `https://wa.me/${cleanNum}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}
