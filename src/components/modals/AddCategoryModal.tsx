import React, { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { X } from 'lucide-react';

const PRESET_COLORS = [
  '#818cf8', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#38bdf8', '#fb7185', '#4ade80',
  '#f97316', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#eab308', '#ef4444', '#3b82f6',
];
const PRESET_ICONS = [
  '🍔', '🏠', '🚗', '🎮', '👕', '💊', '📚', '✈️', '🎬', '🛒', '💡', '📱',
  '🐾', '🎵', '💼', '🏋️', '☕', '🎁', '💇', '🧹', '🏥', '⛽', '🍺', '💰',
];

interface Props { onClose: () => void; }

const AddCategoryModal = ({ onClose }: Props) => {
  const { addCategory } = useFinance();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🛒');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await addCategory({ name: name.trim(), icon, color });
    setSubmitting(false);
    onClose();
  };

  const inputClass = "w-full px-4 py-3 bg-muted rounded-2xl text-foreground border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="glass-strong rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-foreground">Nova Categoria</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" className={inputClass} required />

          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((i) => (
                <button key={i} type="button" onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-accent'}`}
                >{i}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-foreground scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 gradient-primary rounded-2xl text-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {submitting ? 'Salvando...' : 'Criar Categoria'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
