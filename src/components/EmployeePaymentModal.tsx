import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Employee, EmployeePayment } from '../types';
import { X, FileText, FileSpreadsheet, CheckCircle2, Wallet } from 'lucide-react';
import { formatBRL } from '../utils/whatsapp';

interface EmployeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  washes: { carModel: string; washName: string; date: string; totalPrice: number }[];
  amount: number;
  washCount: number;
  revenue: number;
  periodStart: string;
  periodEnd: string;
  storeName: string;
  onConfirm: (payment: EmployeePayment, format: 'pdf' | 'excel') => void;
}

export const EmployeePaymentModal: React.FC<EmployeePaymentModalProps> = ({
  isOpen,
  onClose,
  employee,
  washes,
  amount,
  washCount,
  revenue,
  periodStart,
  periodEnd,
  storeName,
  onConfirm,
}) => {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [confirming, setConfirming] = useState(false);

  if (!isOpen || !employee) return null;

  const getPaidLabel = () => {
    if (employee.payModel === 'salario') {
      return employee.salaryType === 'diario' ? 'Salário diário' : 'Salário mensal';
    }
    if (employee.payModel === 'comissao') return 'Comissão por lavagem';
    return 'Comissão percentual';
  };

  const getAgreedPercent = () => {
    if (employee.payModel === 'salario') {
      return employee.salaryType === 'diario'
        ? `${formatBRL(employee.salaryValue || 0)} / dia`
        : `${formatBRL(employee.salaryValue || 0)} / mês`;
    }
    if (employee.payModel === 'comissao') {
      return `${formatBRL(employee.perWashValue || 0)} / lavagem`;
    }
    return `${employee.percentValue || 0}% das vendas`;
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Comprovante de Pagamento', 105, 12, { align: 'center' });
    doc.setFontSize(10);
    doc.text(storeName, 105, 20, { align: 'center' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Emitido em: ${dateStr} às ${timeStr}`, 14, 36);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Pagamento', 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    let y = 54;
    const line = (label: string, value: string) => {
      doc.text(label, 14, y);
      doc.text(value, 90, y);
      y += 7;
    };

    line('Funcionário:', employee.name);
    line('Código:', employee.code || '-');
    line('Referente a:', getPaidLabel());
    line('Combinado:', getAgreedPercent());
    line('Período:', `${new Date(periodStart).toLocaleDateString('pt-BR')} a ${new Date(periodEnd).toLocaleDateString('pt-BR')}`);
    line('Lavagens realizadas:', String(washCount));
    line('Valor PAGO:', formatBRL(amount));

    y += 8;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(14, y, 196, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Declaro que recebi o valor acima como pagamento.', 14, y);
    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Assinatura do funcionário:', 14, y);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    doc.line(14, y + 6, 110, y + 6);
    y += 20;
    doc.text('Assinatura do patrão:', 14, y);
    doc.line(14, y + 6, 110, y + 6);

    doc.save(`comprovante_${employee.name.replace(/\s+/g, '_')}.pdf`);
  };

  const downloadExcel = () => {
    const rows = washes.map((w, i) => ({
      '#': i + 1,
      'Veículo': w.carModel,
      'Serviço': w.washName,
      'Data': new Date(w.date).toLocaleDateString('pt-BR'),
      'Valor': w.totalPrice,
    }));

    const aoa: (string | number)[][] = [
      [storeName],
      ['Comprovante de Pagamento'],
      [],
      ['Funcionário', employee.name],
      ['Código', employee.code || '-'],
      ['Referente a', getPaidLabel()],
      ['Combinado', getAgreedPercent()],
      ['Período', `${new Date(periodStart).toLocaleDateString('pt-BR')} a ${new Date(periodEnd).toLocaleDateString('pt-BR')}`],
      ['Lavagens', washCount],
      ['Valor PAGO', amount],
      [],
      ['Lavagens realizadas no período:'],
      ['#', 'Veículo', 'Serviço', 'Data', 'Valor'],
      ...rows.map((r) => [r['#'], r['Veículo'], r['Serviço'], r['Data'], r['Valor']]),
      [],
      [`Declaro que recebi o valor acima como pagamento. Data: ${new Date().toLocaleDateString('pt-BR')}`],
      [],
      ['Assinatura do funcionário:'],
      [],
      ['Assinatura do patrão:'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 6 }, { wch: 24 }, { wch: 34 }, { wch: 12 }, { wch: 14 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comprovante');
    XLSX.writeFile(wb, `comprovante_${employee.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleConfirm = () => {
    setConfirming(true);
    const payment: EmployeePayment = {
      id: `pay_${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeCode: employee.code,
      amount,
      washes: washCount,
      revenue,
      periodStart,
      periodEnd,
      paidAt: new Date().toISOString(),
      format,
    };
    try {
      if (format === 'pdf') {
        downloadPdf();
      } else {
        downloadExcel();
      }
    } catch (e) {
      console.error('Falha ao gerar comprovante', e);
    }
    onConfirm(payment, format);
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#18181c] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-[#182622] to-[#141d1a] border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Pagar Funcionário</h3>
              <p className="text-xs text-emerald-200/80">
                {employee.name} • {employee.code}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Amount summary */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#121215] border border-gray-800 text-center">
              <div className="text-[10px] text-gray-500 uppercase">Valor a pagar</div>
              <div className="font-black text-emerald-300 text-lg mt-0.5">
                {formatBRL(amount)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#121215] border border-gray-800 text-center">
              <div className="text-[10px] text-gray-500 uppercase">Lavagens</div>
              <div className="font-black text-white text-lg mt-0.5">{washCount}</div>
            </div>
          </div>

          {/* Format selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Formato do comprovante
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  format === 'pdf'
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-gray-700 bg-[#121215] hover:border-gray-600'
                }`}
              >
                <FileText className={`w-5 h-5 ${format === 'pdf' ? 'text-emerald-400' : 'text-gray-400'}`} />
                <div>
                  <div className="text-xs font-bold text-white">PDF</div>
                  <div className="text-[10px] text-gray-500">Comprovante para imprimir</div>
                </div>
              </button>
              <button
                onClick={() => setFormat('excel')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  format === 'excel'
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-gray-700 bg-[#121215] hover:border-gray-600'
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 ${format === 'excel' ? 'text-emerald-400' : 'text-gray-400'}`} />
                <div>
                  <div className="text-xs font-bold text-white">Excel</div>
                  <div className="text-[10px] text-gray-500">Planilha das lavagens</div>
                </div>
              </button>
            </div>
          </div>

          {/* Signature note */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Assinatura
            </label>
            <div className="p-3 rounded-xl bg-[#121215] border border-gray-800 text-xs text-gray-400">
              O comprovante será gerado sem assinatura. Após imprimir, o funcionário
              e o patrão assinam manualmente no papel.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Ao confirmar, o comprovante é gerado, o pagamento fica no histórico e o
              valor <strong>"A Receber"</strong> deste funcionário zera (acumula a
              partir das próximas lavagens).
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141418] border-t border-gray-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 max-w-xs px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            <span>{confirming ? 'Gerando...' : 'Confirmar Pagamento'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
