import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle, Calendar, DollarSign, Bell } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function NotificationPanel({ notifications, onMarkAsRead, onMarkAllAsRead }) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'budget_alert':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'transaction_approval':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'event_reminder':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'critical_issue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAllAsRead()}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Mark all as read
            </Button>
          )}
        </div>
        {unreadCount > 0 && (
          <p className="text-xs text-slate-600 mt-1">{unreadCount} unread</p>
        )}
      </div>

      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Bell className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-600">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-slate-900">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {format(new Date(notification.created_date), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    {notification.action_url && (
                      <Link to={notification.action_url}>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs p-0 h-auto mt-2"
                          onClick={() => onMarkAsRead(notification.id)}
                        >
                          View Details →
                        </Button>
                      </Link>
                    )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs mt-2 h-auto p-0"
                        onClick={() => onMarkAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}