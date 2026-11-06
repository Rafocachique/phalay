'use client';

import React, { useState } from 'react';

interface ChartDataItem {
  label: string;
  revenue: number;
}

interface PlatformRevenueChartProps {
  monthlyData: ChartDataItem[];
  yearlyData: ChartDataItem[];
}

export default function PlatformRevenueChart({ monthlyData, yearlyData }: PlatformRevenueChartProps) {
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  const activeData = viewType === 'monthly' ? monthlyData : yearlyData;
  const maxRevenue = Math.max(...activeData.map(d => d.revenue), 1);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Ingresos de Plataforma</h2>
          <p className="text-xs text-gray-500 font-medium">
            {viewType === 'monthly' 
              ? 'Análisis comparativo de los últimos 7 meses' 
              : 'Historial de ingresos de los últimos 5 años'}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
            type="button"
            onClick={() => setViewType('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              viewType === 'monthly'
                ? 'text-gray-900 bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Mensual
          </button>
          <button 
            type="button"
            onClick={() => setViewType('yearly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              viewType === 'yearly'
                ? 'text-gray-900 bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Anual
          </button>
        </div>
      </div>
      
      {/* Bars Chart Area */}
      <div className="h-64 flex items-end justify-between px-4 pb-2 border-b border-gray-100 relative">
        <div className="absolute inset-0 flex flex-col justify-between pb-8">
          <div className="w-full border-t border-gray-50"></div>
          <div className="w-full border-t border-gray-50"></div>
          <div className="w-full border-t border-gray-50"></div>
          <div className="w-full border-t border-gray-50"></div>
        </div>
        
        {activeData.map((item, idx) => {
          const actualPercent = maxRevenue > 0 ? Math.round((item.revenue / maxRevenue) * 100) : 0;
          return (
            <div 
              key={idx} 
              className="w-12 h-full flex flex-col justify-end items-center relative z-10 group cursor-pointer"
            >
              {/* Value Indicator on hover */}
              <span className="text-[10px] font-black text-[#8B5A5A] mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#FAE8E8] px-2 py-0.5 rounded shadow-sm border border-[#E8C5C4]/30 pointer-events-none whitespace-nowrap">
                S/ {item.revenue.toFixed(0)}
              </span>

              {/* The Active Bar - Height proportional to value. 
                  Zero value means zero bar height, resolving the confusion. */}
              <div 
                className={`w-full bg-gradient-to-t from-[#8B5A5A] to-[#A87474] rounded-t-lg transition-all duration-700 relative shadow-sm ${
                  actualPercent > 0 
                    ? 'hover:from-[#9B6A6A] hover:to-[#B88484]' 
                    : ''
                }`}
                style={{ height: `${Math.max(actualPercent, 2)}%`, opacity: actualPercent > 0 ? 1 : 0.15 }}
                title={`${item.label}: S/ ${item.revenue.toFixed(2)}`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 rounded-t-lg transition-opacity"></div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-6">
        {activeData.map((item, idx) => (
          <span key={idx} className="w-12 text-center">{item.label}</span>
        ))}
      </div>
    </div>
  );
}
