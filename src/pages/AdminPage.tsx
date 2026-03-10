import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Shield, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PLAN_LABELS, PlanType } from '@/lib/planLimits';

interface UserWithPlan {
  user_id: string;
  email: string;
  plan: string;
  created_at: string;
}

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase.rpc('admin_list_users_with_plans');
    if (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePlanChange = async (targetUserId: string, newPlan: string) => {
    setUpdating(targetUserId);
    const { error } = await supabase.rpc('admin_update_user_plan', {
      _target_user_id: targetUserId,
      _new_plan: newPlan,
    });
    if (error) {
      console.error('Error updating plan:', error);
      toast.error('Erro ao atualizar plano');
    } else {
      toast.success('Plano atualizado com sucesso!');
      setUsers(prev =>
        prev.map(u => (u.user_id === targetUserId ? { ...u, plan: newPlan } : u))
      );
    }
    setUpdating(null);
  };

  const planColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'plus': return 'bg-primary/15 text-primary border-primary/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Painel Admin</h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários e planos</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{users.length} usuário(s) cadastrado(s)</span>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plano Atual</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Alterar Plano</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="font-medium">
                    {u.email}
                    {u.user_id === user?.id && (
                      <Badge variant="outline" className="ml-2 text-[10px]">Você</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${planColor(u.plan)} border`}>
                      {PLAN_LABELS[u.plan as PlanType] || u.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={u.plan}
                      onValueChange={(val) => handlePlanChange(u.user_id, val)}
                      disabled={updating === u.user_id}
                    >
                      <SelectTrigger className="w-[120px] ml-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Grátis</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
