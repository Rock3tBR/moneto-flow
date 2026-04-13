import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFinance } from '@/contexts/FinanceContext';
import { toast } from 'sonner';

interface ParsedCard {
  name: string;
  last_digits: string;
  limit_amount: number;
  closing_day: number;
  due_day: number;
}

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  current_installment: number;
  total_installments: number;
  selected?: boolean;
}

interface ParsedInvoice {
  card: ParsedCard;
  transactions: ParsedTransaction[];
}

interface Props {
  onClose: () => void;
}

const ImportInvoiceModal: React.FC<Props> = ({ onClose }) => {
  const { addCreditCard, addTransaction, creditCards, fetchData } = useFinance();
  const [step, setStep] = useState<'upload' | 'processing' | 'preview' | 'importing' | 'done'>('upload');
  const [parsed, setParsed] = useState<ParsedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Por favor, selecione um arquivo PDF.');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const text = await extractTextFromPdf(file);

      if (text.trim().length < 50) {
        setError('Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.');
        setStep('upload');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('parse-invoice', {
        body: { text },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao processar fatura');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const invoiceData: ParsedInvoice = {
        card: data.card,
        transactions: data.transactions.map((t: ParsedTransaction) => ({ ...t, selected: true })),
      };

      setParsed(invoiceData);
      setStep('preview');
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Erro ao processar o PDF');
      setStep('upload');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const toggleTransaction = (index: number) => {
    if (!parsed) return;
    const updated = { ...parsed };
    updated.transactions = [...updated.transactions];
    updated.transactions[index] = {
      ...updated.transactions[index],
      selected: !updated.transactions[index].selected,
    };
    setParsed(updated);
  };

  const handleImport = async () => {
    if (!parsed) return;
    setStep('importing');

    try {
      // Find or create card
      const existingCard = creditCards.find(
        (c) => c.name.toLowerCase().includes(parsed.card.last_digits) ||
               c.name.toLowerCase() === parsed.card.name.toLowerCase()
      );

      let cardId: string;

      if (existingCard) {
        cardId = existingCard.id;
      } else {
        await addCreditCard({
          name: `${parsed.card.name} (${parsed.card.last_digits})`,
          limit_amount: parsed.card.limit_amount,
          closing_day: parsed.card.closing_day,
          due_day: parsed.card.due_day,
        });
        // Fetch to get the new card
        await fetchData();
        // Find the newly created card
        const { data: cards } = await supabase.from('credit_cards').select('id').order('created_at', { ascending: false }).limit(1);
        cardId = cards?.[0]?.id || '';
      }

      // Import selected transactions
      const selected = parsed.transactions.filter((t) => t.selected);
      for (const t of selected) {
        await addTransaction({
          description: t.description,
          amount: t.amount,
          date: t.date,
          type: 'EXPENSE',
          card_id: cardId,
          installments: t.total_installments,
          current_installment: t.current_installment,
        });
      }

      setStep('done');
      toast.success(`${selected.length} transações importadas com sucesso!`);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Erro ao importar');
      setStep('preview');
    }
  };

  const selectedCount = parsed?.transactions.filter((t) => t.selected).length || 0;
  const selectedTotal = parsed?.transactions.filter((t) => t.selected).reduce((s, t) => s + t.amount, 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Importar Fatura</h2>
            <p className="text-xs text-muted-foreground">Envie um PDF de fatura de cartão de crédito</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Upload step */}
          {step === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-semibold mb-2">Arraste o PDF aqui</p>
              <p className="text-muted-foreground text-sm mb-4">ou clique para selecionar</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="gradient-primary px-6 py-2.5 rounded-2xl text-foreground font-semibold text-sm"
              >
                Selecionar PDF
              </button>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            </div>
          )}

          {/* Processing step */}
          {step === 'processing' && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-foreground font-semibold">Processando fatura...</p>
              <p className="text-muted-foreground text-sm mt-1">Extraindo dados com IA</p>
            </div>
          )}

          {/* Preview step */}
          {step === 'preview' && parsed && (
            <div className="space-y-4">
              {/* Card info */}
              <div className="glass rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Cartão detectado</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-foreground font-bold">{parsed.card.name}</p>
                    <p className="text-muted-foreground text-sm">**** {parsed.card.last_digits}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-semibold">{fmt(parsed.card.limit_amount)}</p>
                    <p className="text-muted-foreground text-xs">Fecha dia {parsed.card.closing_day} · Vence dia {parsed.card.due_day}</p>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {selectedCount} de {parsed.transactions.length} transações selecionadas
                  </p>
                  <p className="text-foreground font-bold text-sm">{fmt(selectedTotal)}</p>
                </div>
                <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                  {parsed.transactions.map((t, i) => (
                    <div
                      key={i}
                      onClick={() => toggleTransaction(i)}
                      className={`glass rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                        t.selected ? 'ring-1 ring-primary/30' : 'opacity-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                        t.selected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {t.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">{t.description}</p>
                        <p className="text-muted-foreground text-xs">
                          {t.date}
                          {t.total_installments > 1 && (
                            <span className="ml-2 text-primary">{t.current_installment}/{t.total_installments}x</span>
                          )}
                        </p>
                      </div>
                      <span className="text-expense font-bold text-sm">{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Importing step */}
          {step === 'importing' && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-foreground font-semibold">Importando transações...</p>
            </div>
          )}

          {/* Done step */}
          {step === 'done' && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full gradient-income mx-auto mb-4 flex items-center justify-center">
                <Check className="w-8 h-8 text-foreground" />
              </div>
              <p className="text-foreground font-bold text-lg">Importação concluída!</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="p-5 border-t border-border/50 flex gap-3">
            <button onClick={() => { setStep('upload'); setParsed(null); }} className="flex-1 py-2.5 rounded-2xl bg-muted text-foreground font-semibold text-sm">
              Voltar
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="flex-1 py-2.5 rounded-2xl gradient-primary text-foreground font-semibold text-sm disabled:opacity-50"
            >
              Importar {selectedCount} transações
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportInvoiceModal;
