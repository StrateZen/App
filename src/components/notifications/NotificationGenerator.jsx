import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function NotificationGenerator({ user }) {
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-monitor'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
    refetchInterval: 60000, // Check every minute
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets-monitor'],
    queryFn: () => base44.entities.Budget.list(),
    refetchInterval: 300000, // Check every 5 minutes
  });

  const { data: flotillas = [] } = useQuery({
    queryKey: ['flotillas-monitor'],
    queryFn: () => base44.entities.Flotilla.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-monitor'],
    queryFn: () => base44.entities.User.list(),
  });

  const createNotificationMutation = useMutation({
    mutationFn: (notificationData) => base44.entities.Notification.create(notificationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    if (!user || !budgets.length || !transactions.length) return;

    checkBudgetAlerts();
    checkPendingApprovals();
  }, [budgets, transactions, user]);

  const checkBudgetAlerts = async () => {
    const currentYear = new Date().getFullYear();
    const yearBudgets = budgets.filter(b => b.budget_year === currentYear);

    for (const budget of yearBudgets) {
      const flotillaTransactions = transactions.filter(
        t => t.flotilla_id === budget.flotilla_id && 
        new Date(t.transaction_date).getFullYear() === currentYear
      );

      const totalExpenses = flotillaTransactions
        .filter(t => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const budgetedExpenses = Object.values(budget.expense_budget || {}).reduce((sum, val) => sum + val, 0);

      const percentageUsed = budgetedExpenses > 0 ? (totalExpenses / budgetedExpenses) * 100 : 0;

      // Alert if over 80% of budget used
      if (percentageUsed >= 80 && percentageUsed < 100) {
        const flotilla = flotillas.find(f => f.id === budget.flotilla_id);
        const flotillaStaff = users.filter(u => 
          u.flotilla_id === budget.flotilla_id && 
          (u.access_level === 'flotilla_staff' || u.access_level === 'division_staff')
        );

        for (const staff of flotillaStaff) {
          // Check if notification already exists
          const existingNotifications = await base44.entities.Notification.filter({
            user_id: staff.id,
            type: 'budget_alert',
            related_entity_id: budget.id
          });

          if (existingNotifications.length === 0) {
            await createNotificationMutation.mutateAsync({
              user_id: staff.id,
              flotilla_id: budget.flotilla_id,
              type: 'budget_alert',
              priority: percentageUsed >= 90 ? 'high' : 'medium',
              title: `Budget Alert: ${flotilla?.flotilla_number || 'Flotilla'}`,
              message: `${percentageUsed.toFixed(1)}% of FY ${budget.budget_year} budget has been used ($${totalExpenses.toFixed(2)} of $${budgetedExpenses.toFixed(2)})`,
              action_url: '/budgets',
              related_entity_id: budget.id
            });
          }
        }
      }

      // Critical alert if over budget
      if (percentageUsed >= 100) {
        const flotilla = flotillas.find(f => f.id === budget.flotilla_id);
        const divisionStaff = users.filter(u => u.access_level === 'division_staff');

        for (const staff of divisionStaff) {
          const existingCritical = await base44.entities.Notification.filter({
            user_id: staff.id,
            type: 'critical_issue',
            related_entity_id: budget.id
          });

          if (existingCritical.length === 0) {
            await createNotificationMutation.mutateAsync({
              user_id: staff.id,
              flotilla_id: budget.flotilla_id,
              type: 'critical_issue',
              priority: 'critical',
              title: `CRITICAL: Budget Exceeded - ${flotilla?.flotilla_number || 'Flotilla'}`,
              message: `FY ${budget.budget_year} budget has been exceeded. Current spending: $${totalExpenses.toFixed(2)} of $${budgetedExpenses.toFixed(2)} (${percentageUsed.toFixed(1)}%)`,
              action_url: '/budgets',
              related_entity_id: budget.id
            });
          }
        }
      }
    }
  };

  const checkPendingApprovals = async () => {
    // Get recent transactions that might need approval (created in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const recentTransactions = transactions.filter(t => 
      new Date(t.created_date) >= oneDayAgo && !t.approved_by
    );

    if (recentTransactions.length > 0 && user.access_level === 'flotilla_staff') {
      const userFlotillaTransactions = recentTransactions.filter(t => t.flotilla_id === user.flotilla_id);
      
      if (userFlotillaTransactions.length > 0) {
        const existing = await base44.entities.Notification.filter({
          user_id: user.id,
          type: 'transaction_approval'
        }, '-created_date', 1);

        const lastNotification = existing[0];
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        // Only create if no notification in last hour
        if (!lastNotification || new Date(lastNotification.created_date) < oneHourAgo) {
          await createNotificationMutation.mutateAsync({
            user_id: user.id,
            flotilla_id: user.flotilla_id,
            type: 'transaction_approval',
            priority: 'medium',
            title: 'Pending Transactions',
            message: `You have ${userFlotillaTransactions.length} transaction(s) that may require approval`,
            action_url: '/transactions'
          });
        }
      }
    }
  };

  return null; // This is a logic-only component
}