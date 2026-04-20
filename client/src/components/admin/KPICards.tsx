import React from 'react';
import { TrendingUp, MessageSquare, Users } from 'lucide-react';

interface KPIData {
  views: { today: number; week: number; month: number };
  comments: { today: number; week: number; month: number };
  signups: { today: number; week: number; month: number };
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      icon: TrendingUp,
      label: 'Total Views',
      today: data.views.today,
      week: data.views.week,
      month: data.views.month,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: MessageSquare,
      label: 'Total Comments',
      today: data.comments.today,
      week: data.comments.week,
      month: data.comments.month,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: Users,
      label: 'New Signups',
      today: data.signups.today,
      week: data.signups.week,
      month: data.signups.month,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-6 rounded border ${card.bgColor} ${card.borderColor} bg-[#0a0a0a]`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">{card.label}</p>
                <h3 className={`text-3xl font-bold ${card.color} mt-2`}>{card.month}</h3>
              </div>
              <Icon size={24} className={card.color} />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Today: <span className={card.color}>{card.today}</span></div>
              <div>Week: <span className={card.color}>{card.week}</span></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
