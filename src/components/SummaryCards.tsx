import React from 'react';
import { Users, UserCheck, UserX, AlertTriangle, TrendingUp, ShieldAlert, Radio } from 'lucide-react';
import { AttendanceMetrics } from '../types/attendance';

interface SummaryCardsProps {
  metrics: AttendanceMetrics;
  onFilterDefaulters: () => void;
  onFilterPresent: () => void;
  onFilterAbsent: () => void;
  onResetFilter: () => void;
  activeStatusFilter: string;
  isDefaulterFilterActive: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  metrics,
  onFilterDefaulters,
  onFilterPresent,
  onFilterAbsent,
  onResetFilter,
  activeStatusFilter,
  isDefaulterFilterActive,
}) => {
  const presentPct = metrics.totalStudents > 0 
    ? Math.round((metrics.presentCount / metrics.totalStudents) * 100) 
    : 0;
  
  const absentPct = metrics.totalStudents > 0 
    ? Math.round((metrics.absentCount / metrics.totalStudents) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Total Students */}
      <button
        onClick={onResetFilter}
        className={`text-left p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'ALL' && !isDefaulterFilterActive
            ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Students
          </span>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {metrics.totalStudents}
            </span>
            <span className="text-xs font-medium text-slate-500">Live Roster</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200" title="Total Working Days Conducted">
            {metrics.workingDays} {metrics.workingDays === 1 ? 'Working Day' : 'Working Days'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Avg Attendance:{' '}
              <strong className="text-slate-900 font-bold">
                {metrics.averagePercentage !== null ? `${metrics.averagePercentage}%` : 'Roster Active'}
              </strong>
            </span>
          </div>
          <span className="text-slate-500 font-medium">
            Conducted: <strong className="text-slate-900 font-semibold">{metrics.workingDays} {metrics.workingDays === 1 ? 'day' : 'days'}</strong>
          </span>
        </div>
      </button>

      {/* 2. Present Students */}
      <button
        onClick={onFilterPresent}
        className={`text-left p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'Present'
            ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20'
            : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            {metrics.presentCount > 0 ? 'Present Today' : 'Active RFID Readers'}
          </span>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            {metrics.presentCount > 0 ? <UserCheck className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            {metrics.presentCount > 0 ? metrics.presentCount : metrics.totalStudents}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
            {metrics.presentCount > 0 ? `${presentPct}% present` : 'Tags Registered'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {metrics.presentCount > 0 ? 'Swiped RFID card via RC522' : 'RC522 reader ready for swipes'}
        </div>
      </button>

      {/* 3. Absent Students */}
      <button
        onClick={onFilterAbsent}
        className={`text-left p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === 'Absent'
            ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20'
            : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Absent Students
          </span>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-700 tracking-tight">
            {metrics.absentCount}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
            {absentPct}% of total
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {metrics.absentCount > 0 ? 'No RFID swipe detected' : 'Zero unexcused absences'}
        </div>
      </button>

      {/* 4. Below 75% Attendance WARNING */}
      <button
        onClick={onFilterDefaulters}
        className={`text-left p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
          isDefaulterFilterActive
            ? 'bg-red-50/80 border-red-500 ring-2 ring-red-500/30'
            : 'bg-white border-red-200 hover:border-red-400 hover:bg-red-50/30 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>&le; 75% Warning</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-red-600 tracking-tight">
            {metrics.belowThresholdCount}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
            metrics.belowThresholdCount > 0 
              ? 'bg-red-100 text-red-800 border-red-200' 
              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}>
            {metrics.belowThresholdCount > 0 ? 'Shortage Risk (≤75%)' : 'All Compliant (>75%)'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1">
          <span>{metrics.belowThresholdCount > 0 ? 'Click to view warning list' : 'Threshold: ≤75% shortage warning'}</span>
        </div>
      </button>

    </div>
  );
};
