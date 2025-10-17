import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { useLang } from '../../lib/LangContext';
import { t } from '../../lib/i18n';
import { ordersAPI, Order } from '../../lib/supabase';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  onRefresh: () => void;
}

export default function AdminOrders({ orders, onRefresh }: AdminOrdersProps) {
  const { lang } = useLang();

  const handleComplete = async (id: string) => {
    try {
      await ordersAPI.update(id, 'completed');
      toast.success('Order marked as completed');
      onRefresh();
    } catch (error: any) {
      console.error('Complete error:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">{t('orders', lang)}</h2>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 sm:w-32">Order ID</TableHead>
              <TableHead className="min-w-[150px]">Items</TableHead>
              <TableHead className="w-24">Total</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="min-w-[120px] hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-start text-muted-foreground py-8 text-sm sm:text-base">
                  No orders yet
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs sm:text-sm">
                    {order.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="text-xs sm:text-sm">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-sm sm:text-base">₺{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                    {new Date(order.created_at).toLocaleString(
                      lang === 'tr' ? 'tr-TR' : lang === 'ar' ? 'ar-SA' : 'en-US',
                      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(order.id)}
                        className="gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                      >
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Complete</span>
                        <span className="sm:hidden">✓</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
