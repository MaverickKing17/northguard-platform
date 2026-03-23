/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Search, Bell, ChevronDown, LayoutDashboard, 
  ShieldAlert, Activity, Crosshair, AlertTriangle, 
  FileText, Scale, Users, Lock, BarChart3, 
  Settings, Share2, Download, RefreshCw, 
  Menu, X, ExternalLink, Filter, ArrowUp, ArrowDown,
  Clock, MapPin, Globe, UserCheck, Database, Zap,
  TrendingUp, BrainCircuit, Link, AlertCircle, Sparkles
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { ChatWidget } from './components/ChatWidget';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Chart.js Defaults ---
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

const chartDefaults = {
  color: '#A8BBCF',
  font: {
    family: "'IBM Plex Mono', monospace",
    size: 11,
  },
  plugins: {
    legend: {
      labels: {
        usePointStyle: true,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#0D1F47',
      borderColor: 'rgba(74, 144, 217, 0.4)',
      borderWidth: 1,
      titleColor: '#FFFFFF',
      bodyColor: '#A8BBCF',
      padding: 12,
      cornerRadius: 6,
      displayColors: true,
    },
  },
};

ChartJS.defaults.set(chartDefaults);

// --- AI Service ---
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// --- Mock Data ---
const DATA = {
  kpis: [
    { id: 1, label: 'Active Threat Alerts', value: '23', trend: '+4', trendDir: 'up', trendColor: 'red', sub: '3 Critical · 8 High · 12 Medium', status: '3 require immediate action', statusColor: 'red' },
    { id: 2, label: 'Fraud Prevented — MTD', value: '$2.34M', trend: '+12.4%', trendDir: 'up', trendColor: 'green', sub: '847 transactions blocked', status: 'FINTRAC STR filed: 14 MTD', statusColor: 'green' },
    { id: 3, label: 'OSFI Composite Compliance', value: '94.7%', trend: '−0.3%', trendDir: 'down', trendColor: 'amber', sub: '2 controls require attention', status: 'B-13 review due Apr 2', statusColor: 'amber' },
    { id: 4, label: 'Identity Events — Today', value: '1,204', trend: '+18%', trendDir: 'up', trendColor: 'amber', sub: '7 privileged access anomalies', status: '2 admin accounts under review', statusColor: 'amber' },
  ],
  alerts: [
    { id: 1, severity: 'CRITICAL', category: 'Cyber', title: 'Credential Stuffing Attack — Corporate Banking Portal', desc: '2,847 failed login attempts from 94 unique IPs across 7 countries in last 23 minutes.', meta: 'Account: svc-corp-portal-01 | Origin: 195.62.x.x (RU)', time: '14 minutes ago' },
    { id: 2, severity: 'CRITICAL', category: 'Fraud', title: 'Large Suspicious Wire Transfer — FINTRAC Threshold', desc: 'Outbound wire CAD $487,000 to previously unknown beneficiary in UAE flagged by AI model.', meta: 'Account: RDFI-ACC-00984432 | Analyst: Unassigned', time: '22 minutes ago' },
    { id: 3, severity: 'HIGH', category: 'Compliance', title: 'OSFI B-10 Third-Party Risk — Vendor Access Anomaly', desc: 'Cloud storage vendor "StoreSafe Inc." accessed client data outside contract hours (02:14 AM).', meta: 'Vendor ID: VND-2291 | Data Classification: PII-Level 3', time: '41 minutes ago' },
    { id: 4, severity: 'HIGH', category: 'Identity', title: 'Privileged Account — Unusual Admin Activity', desc: 'Domain admin "svc_dbadmin_prod" exported 14,000 records from core banking DB outside business hours.', meta: 'User: j.kowalski@rdfi.ca | Host: RDFI-DB-PROD-04', time: '1 hour ago' },
    { id: 5, severity: 'HIGH', category: 'AML', title: 'AML Pattern — Structuring Detected (Smurfing)', desc: 'AI model detected 17 transactions just below $10,000 CAD threshold across 9 accounts in 6 hours.', meta: 'Branch: Toronto Financial District #042 | Pattern Score: 94/100', time: '1.5 hours ago' },
  ],
  incidents: [
    { 
      id: 'INC-2025-0847', 
      severity: 'CRITICAL', 
      category: 'Fraud', 
      title: 'Wire Transfer Fraud — UAE Beneficiary', 
      entity: 'ACC-00984432', 
      assignee: 'M. Okonkwo', 
      status: 'Investigating', 
      created: '14m ago', 
      sla: '2h',
      correlatedAlerts: [
        { id: 'ALR-442', title: 'Unusual Outbound Connection', source: 'Firewall-01', time: '16m ago' },
        { id: 'ALR-445', title: 'Privileged Account Login (UAE)', source: 'AD-Auth', time: '18m ago' },
        { id: 'ALR-448', title: 'Large Transfer Initiation', source: 'Core-Banking', time: '14m ago' }
      ]
    },
    { 
      id: 'INC-2025-0846', 
      severity: 'CRITICAL', 
      category: 'Cyber', 
      title: 'Credential Stuffing — Corp Banking Portal', 
      entity: 'svc-corp-portal', 
      assignee: 'K. Patel', 
      status: 'Containment', 
      created: '22m ago', 
      sla: '2h',
      correlatedAlerts: [
        { id: 'ALR-390', title: 'High Auth Failure Rate', source: 'WAF-02', time: '25m ago' },
        { id: 'ALR-392', title: 'Tor Exit Node Detected', source: 'IDS-01', time: '24m ago' }
      ]
    },
    { id: 'INC-2025-0845', severity: 'HIGH', category: 'AML', title: 'Structuring Pattern — 17 Transactions', entity: 'BR-042-Toronto', assignee: 'L. Tremblay', status: 'Under Review', created: '1.5h ago', sla: '8h', correlatedAlerts: [] },
    { id: 'INC-2025-0844', severity: 'HIGH', category: 'Identity', title: 'Admin DB Export — After Hours', entity: 'j.kowalski@rdfi', assignee: 'S. Chen', status: 'Escalated', created: '1h ago', sla: '4h', correlatedAlerts: [] },
    { id: 'INC-2025-0843', severity: 'HIGH', category: 'Third-Party', title: 'StoreSafe Vendor Access Anomaly', entity: 'VND-2291', assignee: 'R. Singh', status: 'Open', created: '41m ago', sla: '8h', correlatedAlerts: [] },
    { id: 'INC-2025-0842', severity: 'HIGH', category: 'Identity', title: 'MFA Bypass — SVP Account', entity: 'm.okafor@rdfi', assignee: 'K. Patel', status: 'Monitoring', created: '2h ago', sla: '4h', correlatedAlerts: [] },
    { id: 'INC-2025-0841', severity: 'MEDIUM', category: 'Fraud', title: 'Phishing Campaign — Wealth Clients', entity: 'PHI-2025-0318', assignee: 'C. Bouchard', status: 'Remediation', created: '2.5h ago', sla: '24h', correlatedAlerts: [] },
    { id: 'INC-2025-0840', severity: 'MEDIUM', category: 'Cyber', title: 'API Abuse — Open Banking Endpoint', entity: 'OBK-PAYLINK-017', assignee: 'R. Singh', status: 'Monitoring', created: '3h ago', sla: '24h', correlatedAlerts: [] },
    { id: 'INC-2025-0839', severity: 'MEDIUM', category: 'Compliance', title: 'PCI DSS Control Gap — Card Vault', entity: 'PCI-CTRL-44', assignee: 'L. Tremblay', status: 'In Progress', created: '5h ago', sla: '48h', correlatedAlerts: [] },
    { id: 'INC-2025-0838', severity: 'INFO', category: 'Compliance', title: 'OSFI Submission — Pending CFO Sign-off', entity: 'RC1-Q1-2025', assignee: 'CFO Office', status: 'Pending', created: '4h ago', sla: '5d', correlatedAlerts: [] },
  ]
};

// --- Components ---

const Sidebar = ({ collapsed, setCollapsed, activeView, setActiveView }: { 
  collapsed: boolean, 
  setCollapsed: (v: boolean) => void,
  activeView: string,
  setActiveView: (v: string) => void
}) => {
  const sections = [
    {
      title: 'Overview',
      items: [
        { icon: LayoutDashboard, label: 'Security Overview', id: 'overview' },
      ]
    },
    {
      title: 'Threat Intelligence',
      items: [
        { icon: ShieldAlert, label: 'Threat Center', id: 'threat-center' },
        { icon: Activity, label: 'Cyber Monitoring', id: 'cyber-monitoring' },
        { icon: Crosshair, label: 'Threat Hunting', id: 'threat-hunting' },
      ]
    },
    {
      title: 'Fraud & Financial Crime',
      items: [
        { icon: AlertTriangle, label: 'Fraud Detection', id: 'fraud-detection' },
        { icon: Scale, label: 'AML & FINTRAC Monitoring', id: 'aml-fintrac' },
        { icon: Zap, label: 'Transaction Risk', id: 'transaction-risk' },
      ]
    },
    {
      title: 'Compliance & Regulatory',
      items: [
        { icon: FileText, label: 'OSFI Compliance', id: 'osfi-compliance' },
        { icon: FileText, label: 'FINTRAC Reporting', id: 'fintrac-reporting' },
        { icon: Scale, label: 'Audit & Governance', id: 'audit-governance' },
        { icon: UserCheck, label: 'Policy Management', id: 'policy-management' },
      ]
    },
    {
      title: 'Identity & Access',
      items: [
        { icon: Users, label: 'Identity Management', id: 'identity-mgmt' },
        { icon: Lock, label: 'Privileged Access (PAM)', id: 'pam' },
        { icon: Lock, label: 'MFA & Authentication', id: 'mfa' },
      ]
    },
    {
      title: 'Intelligence & Reports',
      items: [
        { icon: BarChart3, label: 'Executive Reports', id: 'exec-reports' },
        { icon: Zap, label: 'AI Insights', id: 'ai-insights' },
        { icon: Download, label: 'Data Exports', id: 'data-exports' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { icon: Settings, label: 'Configuration', id: 'config' },
        { icon: Share2, label: 'Integrations', id: 'integrations' },
        { icon: Users, label: 'Team & Roles', id: 'team-roles' },
      ]
    }
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-14 bottom-0 bg-[#0D1F47] border-r border-border-subtle transition-all duration-300 z-50 overflow-y-auto overflow-x-hidden",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="p-4 flex flex-col gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            {!collapsed && (
              <h3 className="text-[10px] uppercase font-mono text-text-secondary tracking-[0.12em] px-3 mb-1 select-none">
                {section.title}
              </h3>
            )}
            {section.items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.id);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group w-full text-left cursor-pointer outline-none",
                  activeView === item.id ? "sidebar-item-active" : "sidebar-item-hover text-text-secondary"
                )}
                title={item.label}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", activeView === item.id ? "text-arctic" : "group-hover:text-text-primary")} />
                {!collapsed && <span className="text-sm font-medium whitespace-nowrap pointer-events-none">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-border-subtle flex flex-col gap-3">
        {!collapsed && (
          <>
            <div className="flex items-center gap-2 text-[10px] text-text-secondary font-mono">
              <span>🇨🇦</span>
              <span>Data residency: Canada (Toronto)</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[9px] bg-slate px-1.5 py-0.5 rounded border border-border-subtle text-muted">SOC 2 Type II</span>
              <span className="text-[9px] bg-slate px-1.5 py-0.5 rounded border border-border-subtle text-muted">ISO 27001</span>
            </div>
            <div className="text-[9px] text-text-secondary font-mono opacity-50">
              v4.2.1 — Build 20250318
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

const KPICard: React.FC<{ kpi: typeof DATA.kpis[0] }> = ({ kpi }) => {
  const isUp = kpi.trendDir === 'up';
  const trendColor = kpi.trendColor === 'red' ? 'text-red' : kpi.trendColor === 'green' ? 'text-green' : 'text-amber';
  
  return (
    <div className="kpi-card">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-text-secondary uppercase tracking-wider">{kpi.label}</span>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          kpi.id === 1 ? "bg-red/10 text-red" : 
          kpi.id === 2 ? "bg-green/10 text-green" :
          kpi.id === 3 ? "bg-ice/10 text-ice" : "bg-arctic/10 text-arctic"
        )}>
          {kpi.id === 1 && <ShieldAlert className="w-4 h-4" />}
          {kpi.id === 2 && <Zap className="w-4 h-4" />}
          {kpi.id === 3 && <Scale className="w-4 h-4" />}
          {kpi.id === 4 && <Users className="w-4 h-4" />}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className={cn("text-3xl font-bold tracking-tight", kpi.id === 1 ? "text-red" : "text-text-primary")}>
          {kpi.value}
        </div>
        <div className={cn("flex items-center gap-1.5 text-xs font-mono", trendColor)}>
          {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          <span>{kpi.trend} from yesterday</span>
        </div>
      </div>
      <div className="text-[10px] text-text-secondary font-mono mt-1">
        {kpi.sub}
      </div>
      <div className="h-8 mt-2 opacity-50">
        {/* Placeholder for sparkline */}
        <div className="w-full h-full flex items-end gap-1">
          {[40, 60, 45, 70, 55, 80, 65, 90].map((h, i) => (
            <div 
              key={i} 
              className={cn("flex-1 rounded-t-sm", kpi.trendColor === 'red' ? "bg-red" : kpi.trendColor === 'green' ? "bg-green" : "bg-amber")}
              style={{ height: `${h}%`, opacity: (i + 1) / 8 }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-border-subtle mt-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", kpi.statusColor === 'red' ? "bg-red pulse-red" : kpi.statusColor === 'green' ? "bg-green" : "bg-amber")} />
        <span className={cn("text-[10px] font-mono", kpi.statusColor === 'red' ? "text-red" : kpi.statusColor === 'green' ? "text-green" : "text-amber")}>
          {kpi.status}
        </span>
      </div>
    </div>
  );
};

const threatBarData = {
  labels: ['Phishing / BEC', 'Credential Stuffing', 'SQL Injection', 'API Abuse', 'Ransomware Probing', 'Insider Threat', 'Supply Chain / 3P'],
  datasets: [{
    data: [342, 271, 198, 147, 112, 87, 54],
    backgroundColor: (context: any) => {
      const ctx = context.chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 400, 0);
      gradient.addColorStop(0, '#4A90D9');
      gradient.addColorStop(1, '#7EC8E3');
      return gradient;
    },
    borderRadius: 4,
    barThickness: 16,
  }]
};

const threatLineData = {
  labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
  datasets: [
    {
      label: 'Critical',
      data: [5, 3, 2, 4, 8, 12, 10, 8, 15, 20, 18, 25, 30, 28, 35, 40, 38, 35, 30, 25, 20, 15, 10, 8],
      borderColor: '#E84040',
      backgroundColor: 'rgba(232, 64, 64, 0.1)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'High',
      data: [10, 8, 12, 15, 20, 25, 22, 20, 28, 35, 32, 40, 45, 42, 50, 55, 52, 50, 45, 40, 35, 30, 25, 20],
      borderColor: '#F5A623',
      backgroundColor: 'rgba(245, 166, 35, 0.1)',
      fill: true,
      tension: 0.4,
    }
  ]
};

const ThreatIntelligence = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'vectors' | 'timeline'>('map');

  return (
    <div className="glass-card flex flex-col h-full">
      <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-slate/20">
        <h3 className="text-sm font-bold">Threat Intelligence Map & Activity</h3>
        <div className="flex gap-1 bg-navy/50 p-1 rounded-lg border border-border-subtle">
          {(['map', 'vectors', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1 text-[10px] font-mono rounded transition-all",
                activeTab === tab ? "bg-ice/20 text-arctic border border-ice/30" : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 flex-1 relative overflow-hidden">
        {activeTab === 'map' && (
          <div className="w-full h-full flex flex-col gap-4">
            <div className="flex-1 bg-navy/40 rounded-lg border border-border-subtle relative overflow-hidden">
              {/* Simplified SVG Map of Canada */}
              <svg viewBox="0 0 800 400" className="w-full h-full opacity-40">
                <path d="M100,100 L700,100 L750,200 L700,350 L100,350 L50,200 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                {/* Dots for cities */}
                <circle cx="200" cy="250" r="4" fill="#E84040" className="pulse-red" />
                <circle cx="400" cy="280" r="4" fill="#E84040" className="pulse-red" />
                <circle cx="600" cy="220" r="4" fill="#F5A623" />
              </svg>
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <div className="w-2 h-2 rounded-full bg-red pulse-red" />
                  <span>Active Attack: Toronto, Vancouver</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <div className="w-2 h-2 rounded-full bg-amber" />
                  <span>Suspicious: Montreal, Calgary</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-mono text-text-secondary">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red" /> Active Attack</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber" /> Suspicious</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-ice" /> Monitoring</div>
            </div>
          </div>
        )}
        {activeTab === 'vectors' && (
          <div className="h-full">
            <Bar 
              data={threatBarData} 
              options={{ 
                indexAxis: 'y', 
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
              }} 
            />
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="h-full">
            <Line 
              data={threatLineData} 
              options={{ 
                plugins: { legend: { position: 'top' } },
                scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

const AlertFeed = () => {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Critical', 'Fraud', 'Compliance', 'Identity'];

  return (
    <div className="glass-card flex flex-col h-full">
      <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-slate/20">
        <h3 className="text-sm font-bold">AI Alert Feed</h3>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-mono rounded border transition-all",
                  filter === f ? "bg-ice/20 text-arctic border-ice/40" : "text-text-secondary border-transparent hover:border-border-subtle"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green pulse-green" />
            <span className="text-[9px] font-mono text-green">Auto-scroll ON</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {DATA.alerts.map(alert => (
          <div key={alert.id} className="p-3 bg-navy/30 border border-border-subtle rounded-lg hover:border-ice/30 transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded",
                alert.severity === 'CRITICAL' ? "bg-red/20 text-red" : "bg-amber/20 text-amber"
              )}>
                {alert.severity}
              </span>
              <span className="text-[9px] font-mono text-text-secondary">{alert.time}</span>
            </div>
            <h4 className="text-xs font-semibold mb-1 group-hover:text-arctic transition-colors">{alert.title}</h4>
            <p className="text-[10px] text-text-secondary font-mono mb-2 leading-relaxed">{alert.desc}</p>
            <div className="flex justify-between items-center pt-2 border-t border-border-subtle/50">
              <span className="text-[9px] font-mono text-text-secondary opacity-60">{alert.meta}</span>
              <div className="flex gap-1.5">
                <button className="text-[9px] font-mono text-arctic hover:underline">Investigate</button>
                <button className="text-[9px] font-mono text-text-secondary hover:underline">Dismiss</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const fraudDoughnutData = {
  labels: ['Card-Not-Present', 'Account Takeover', 'Wire/Interac Fraud', 'Identity Fraud', 'Insider Fraud'],
  datasets: [{
    data: [38, 24, 19, 12, 7],
    backgroundColor: ['#E84040', '#F5A623', '#4A90D9', '#805AD5', '#A8BBCF'],
    borderWidth: 0,
  }]
};

const identityRiskData = {
  labels: ['Tech', 'Fin', 'Ops', 'Risk', 'Exec'],
  datasets: [
    { label: 'High', data: [3, 1, 2, 0, 1], backgroundColor: '#E84040' },
    { label: 'Med', data: [12, 8, 15, 3, 2], backgroundColor: '#F5A623' },
    { label: 'Normal', data: [287, 142, 398, 87, 23], backgroundColor: '#4A90D9' },
  ]
};

const BottomPanels = () => {
  const complianceItems = [
    { label: 'OSFI Guideline B-10 (Third-Party Risk)', value: 98, status: 'Compliant' },
    { label: 'OSFI Guideline B-13 (Cyber Risk)', value: 89, status: 'Review Due', color: 'amber' },
    { label: 'FINTRAC STR Submissions (MTD)', value: 100, status: 'On Track' },
    { label: 'FINTRAC LCTR Reporting', value: 100, status: 'On Track' },
    { label: 'AML/CTF Program Effectiveness', value: 94, status: 'Compliant' },
    { label: 'PIPEDA Data Privacy Controls', value: 91, status: 'Compliant' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 px-4 pb-4">
      {/* Fraud Detection */}
      <div className="glass-card flex flex-col">
        <div className="p-3 border-b border-border-subtle bg-slate/20">
          <h3 className="text-xs font-bold">Fraud Detection — Live</h3>
          <p className="text-[9px] font-mono text-text-secondary">Powered by NorthGuard ML Engine v3.1</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="h-40 relative">
            <Doughnut 
              data={fraudDoughnutData} 
              options={{ 
                cutout: '70%', 
                plugins: { legend: { display: false } } 
              }} 
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold">847</span>
              <span className="text-[9px] font-mono text-text-secondary">Blocked MTD</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] font-mono text-text-secondary mb-1">False Positive Rate</div>
              <div className="flex items-center gap-1 text-green">
                <ArrowDown className="w-3 h-3" />
                <span className="text-sm font-bold">0.23%</span>
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-text-secondary mb-1">Avg Detection Time</div>
              <div className="flex items-center gap-1 text-green">
                <ArrowDown className="w-3 h-3" />
                <span className="text-sm font-bold">1.4s</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border-subtle">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-mono text-text-secondary">Model Confidence</span>
              <span className="text-[9px] font-mono text-green">96.8%</span>
            </div>
            <div className="w-full h-1 bg-navy rounded-full overflow-hidden">
              <div className="h-full bg-green" style={{ width: '96.8%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="glass-card flex flex-col">
        <div className="p-3 border-b border-border-subtle bg-slate/20">
          <h3 className="text-xs font-bold">Regulatory Compliance Status</h3>
          <p className="text-[9px] font-mono text-text-secondary">OSFI · FINTRAC · PCMLTFA · CSA</p>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {complianceItems.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-text-secondary truncate max-w-[180px]">{item.label}</span>
                <span className={cn(item.value < 90 ? "text-amber" : "text-green")}>{item.value}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-navy rounded-full overflow-hidden">
                  <div className={cn("h-full", item.value < 90 ? "bg-amber" : "bg-green")} style={{ width: `${item.value}%` }} />
                </div>
                <span className={cn("text-[8px] font-mono whitespace-nowrap", item.value < 90 ? "text-amber" : "text-green")}>
                  {item.status === 'Compliant' || item.status === 'On Track' ? '✓' : '⚠'} {item.status}
                </span>
              </div>
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-border-subtle flex items-center gap-2 text-[10px] font-mono text-text-secondary">
            <LayoutDashboard className="w-3 h-3" />
            <span>Next OSFI Examination: Estimated Q3 2025</span>
          </div>
        </div>
      </div>

      {/* Identity & Access */}
      <div className="glass-card flex flex-col">
        <div className="p-3 border-b border-border-subtle bg-slate/20">
          <h3 className="text-xs font-bold">Identity & Access — Risk Overview</h3>
          <p className="text-[9px] font-mono text-text-secondary">User Activity Risk by Department</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="h-32">
            <Bar 
              data={identityRiskData} 
              options={{ 
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: { 
                  x: { stacked: true, display: false }, 
                  y: { stacked: true, grid: { display: false }, ticks: { font: { size: 9 } } } 
                }
              }} 
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-navy/30 border border-border-subtle rounded-lg">
              <div className="text-[9px] font-mono text-text-secondary">Total Active Users</div>
              <div className="text-sm font-bold">4,847</div>
              <div className="text-[8px] font-mono text-green">↑ 23 since Monday</div>
            </div>
            <div className="p-2 bg-navy/30 border border-border-subtle rounded-lg">
              <div className="text-[9px] font-mono text-text-secondary">Privileged Accounts</div>
              <div className="text-sm font-bold">128</div>
              <div className="text-[8px] font-mono text-amber">7 anomalies today</div>
            </div>
            <div className="p-2 bg-navy/30 border border-border-subtle rounded-lg">
              <div className="text-[9px] font-mono text-text-secondary">MFA Coverage</div>
              <div className="text-sm font-bold">99.1%</div>
              <div className="text-[8px] font-mono text-green">↑ 0.2% this week</div>
            </div>
            <div className="p-2 bg-navy/30 border border-border-subtle rounded-lg">
              <div className="text-[9px] font-mono text-text-secondary">Failed Auth (24hr)</div>
              <div className="text-sm font-bold">3,204</div>
              <div className="text-[8px] font-mono text-amber">↑ 18% vs baseline</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const dailyTrendData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Critical Incidents',
      data: [2, 5, 3, 8, 4, 1, 3],
      borderColor: '#FF4444',
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#FF4444',
    },
    {
      label: 'High Severity',
      data: [8, 12, 7, 15, 10, 4, 6],
      borderColor: '#F27D26',
      backgroundColor: 'rgba(242, 125, 38, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: '#F27D26',
    }
  ]
};

const weeklyTrendData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [
    {
      label: 'Critical Incidents',
      data: [18, 24, 15, 22],
      borderColor: '#FF4444',
      backgroundColor: 'rgba(255, 68, 68, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
    },
    {
      label: 'High Severity',
      data: [45, 52, 38, 48],
      borderColor: '#F27D26',
      backgroundColor: 'rgba(242, 125, 38, 0.1)',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
    }
  ]
};

const resolutionTrendData = {
  labels: ['Critical', 'High', 'Medium', 'Low'],
  datasets: [
    {
      label: 'Avg. Resolution Time (Hours)',
      data: [1.8, 4.2, 12.5, 36.0],
      backgroundColor: [
        'rgba(255, 68, 68, 0.6)',
        'rgba(242, 125, 38, 0.6)',
        'rgba(0, 255, 255, 0.6)',
        'rgba(142, 146, 153, 0.6)',
      ],
      borderColor: [
        '#FF4444',
        '#F27D26',
        '#00FFFF',
        '#8E9299',
      ],
      borderWidth: 1,
    }
  ]
};

const trendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: '#8E9299',
        font: { size: 10, family: 'JetBrains Mono' },
        boxWidth: 12,
        padding: 15,
      }
    },
    tooltip: {
      backgroundColor: '#151619',
      titleFont: { size: 12, family: 'JetBrains Mono' },
      bodyFont: { size: 11, family: 'JetBrains Mono' },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 10,
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: '#8E9299', font: { size: 10, family: 'JetBrains Mono' } }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#8E9299', font: { size: 10, family: 'JetBrains Mono' } }
    }
  }
};

const IncidentTrendAnalysis = () => {
  const [view, setView] = useState<'daily' | 'weekly'>('daily');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 px-4">
      <div className="glass-card p-4 h-[280px] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-arctic" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Incident Volume Trend</h4>
          </div>
          <div className="flex bg-navy/50 border border-border-subtle rounded-md p-0.5">
            <button 
              onClick={() => setView('daily')}
              className={cn(
                "px-3 py-1 text-[10px] font-mono rounded transition-colors",
                view === 'daily' ? "bg-ice/20 text-arctic" : "text-text-secondary hover:text-arctic"
              )}
            >
              DAILY
            </button>
            <button 
              onClick={() => setView('weekly')}
              className={cn(
                "px-3 py-1 text-[10px] font-mono rounded transition-colors",
                view === 'weekly' ? "bg-ice/20 text-arctic" : "text-text-secondary hover:text-arctic"
              )}
            >
              WEEKLY
            </button>
          </div>
        </div>
        <div className="flex-1">
          <Line data={view === 'daily' ? dailyTrendData : weeklyTrendData} options={trendChartOptions} />
        </div>
      </div>

      <div className="glass-card p-4 h-[280px] flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-arctic" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Avg. Resolution Time (SLA Performance)</h4>
        </div>
        <div className="flex-1">
          <Bar data={resolutionTrendData} options={trendChartOptions} />
        </div>
      </div>
    </div>
  );
};

const IncidentTable = ({ onRowClick }: { onRowClick: (incident: any) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredIncidents = useMemo(() => {
    return DATA.incidents.filter(inc => 
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.assignee.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col">
      <IncidentTrendAnalysis />
      <div className="glass-card mx-4 mb-4 flex flex-col">
      <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-slate/20">
        <h3 className="text-sm font-bold">Active Security Incidents</h3>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search by ID, type, assignee..." 
              className="bg-navy/50 border border-border-subtle rounded-md pl-8 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-ice/50 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="bg-navy/50 border border-border-subtle rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none">
            <option>All Severities</option>
            <option>Critical</option>
            <option>High</option>
          </select>
          <select className="bg-navy/50 border border-border-subtle rounded-md px-3 py-1.5 text-xs font-mono focus:outline-none">
            <option>All Statuses</option>
            <option>Investigating</option>
            <option>Containment</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy/40 border-b border-border-subtle">
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">ID</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">Severity</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">Category</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">Title</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">Entity</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">Assigned To</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">Status</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">Created</th>
              <th className="p-3 text-[10px] font-mono text-text-secondary uppercase tracking-wider">SLA</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.map((inc, i) => (
              <tr 
                key={i} 
                onClick={() => onRowClick(inc)}
                className="border-b border-border-subtle/30 hover:bg-ice/5 cursor-pointer transition-colors group"
              >
                <td className="p-3 text-xs font-mono text-arctic font-medium">{inc.id}</td>
                <td className="p-3">
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded-full",
                    inc.severity === 'CRITICAL' ? "bg-red/20 text-red border border-red/30" :
                    inc.severity === 'HIGH' ? "bg-amber/20 text-amber border border-amber/30" :
                    inc.severity === 'MEDIUM' ? "bg-ice/20 text-ice border border-ice/30" :
                    "bg-text-secondary/20 text-text-secondary border border-text-secondary/30"
                  )}>
                    {inc.severity}
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-[9px] font-mono text-text-secondary border border-border-subtle px-2 py-0.5 rounded-full">
                    {inc.category}
                  </span>
                </td>
                <td className="p-3 text-xs font-medium group-hover:text-arctic transition-colors">{inc.title}</td>
                <td className="p-3 text-[10px] font-mono text-text-secondary">{inc.entity}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate border border-border-subtle flex items-center justify-center text-[8px] font-bold text-arctic">
                      {inc.assignee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs">{inc.assignee}</span>
                  </div>
                </td>
                <td className="p-3">
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    inc.status === 'Investigating' ? "bg-red/10 text-red" :
                    inc.status === 'Containment' ? "bg-amber/10 text-amber" :
                    inc.status === 'Monitoring' ? "bg-ice/10 text-ice" :
                    inc.status === 'Escalated' ? "bg-purple-500/10 text-purple-400" :
                    "bg-text-secondary/10 text-text-secondary"
                  )}>
                    {inc.status}
                  </span>
                </td>
                <td className="p-3 text-[10px] font-mono text-text-secondary">{inc.created}</td>
                <td className="p-3">
                  <span className={cn(
                    "text-[10px] font-mono",
                    inc.severity === 'CRITICAL' ? "text-red" : "text-green"
                  )}>
                    {inc.sla} {inc.severity === 'CRITICAL' ? '⚠' : '✓'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-border-subtle flex justify-between items-center bg-slate/10">
        <span className="text-[10px] font-mono text-text-secondary">Showing 1–{filteredIncidents.length} of {filteredIncidents.length} incidents</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-[10px] font-mono border border-border-subtle rounded hover:bg-ice/10 transition-all">Prev</button>
          <button className="px-3 py-1 text-[10px] font-mono border border-ice/40 bg-ice/10 text-arctic rounded">1</button>
          <button className="px-3 py-1 text-[10px] font-mono border border-border-subtle rounded hover:bg-ice/10 transition-all">2</button>
          <button className="px-3 py-1 text-[10px] font-mono border border-border-subtle rounded hover:bg-ice/10 transition-all">Next</button>
        </div>
      </div>
    </div>
  </div>
  );
};

const IncidentDrawer = ({ incident, onClose }: { incident: any, onClose: () => void }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [rootCause, setRootCause] = useState<string | null>(null);

  if (!incident) return null;

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const model = genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this security incident and correlated alerts to suggest a potential root cause and mitigation steps for a Canadian financial institution.
        
        Incident: ${incident.title}
        Severity: ${incident.severity}
        Entity: ${incident.entity}
        Correlated Alerts: ${JSON.stringify(incident.correlatedAlerts || [])}
        
        Provide a concise analysis in 3-4 bullet points. Focus on technical root cause and specific Canadian regulatory impact (e.g. OSFI B-13).`,
      });
      
      const response = await model;
      setRootCause(response.text || "Unable to generate analysis.");
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setRootCause("AI analysis unavailable. Please check system logs.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[90]"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-[480px] bg-[#0D1F47] border-l border-border-subtle z-[100] shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-slate/20">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-arctic">{incident.id}</span>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              incident.severity === 'CRITICAL' ? "bg-red/20 text-red border border-red/30" : "bg-amber/20 text-amber border border-amber/30"
            )}>
              {incident.severity}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <section>
            <h2 className="text-xl font-bold mb-2">{incident.title}</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red pulse-red" />
                <span className="text-xs font-mono text-red">{incident.status}</span>
              </div>
              <div className="text-xs font-mono text-text-secondary">Created: {incident.created}</div>
              <div className="text-xs font-mono text-text-secondary">SLA: {incident.sla}</div>
            </div>
            <div className="flex gap-2 mb-6">
              {['Detected', 'Triaged', 'Investigating', 'Contained', 'Remediated', 'Closed'].map((step, i) => (
                <div key={i} className="flex-1 flex flex-col gap-1">
                  <div className={cn(
                    "h-1 rounded-full",
                    i <= 2 ? "bg-ice" : "bg-navy"
                  )} />
                  <span className={cn(
                    "text-[8px] font-mono text-center",
                    i === 2 ? "text-arctic font-bold" : "text-text-secondary opacity-50"
                  )}>{step}</span>
                </div>
              ))}
            </div>
          </section>

          {/* AI Root Cause Analysis Section */}
          <section className="p-4 bg-ice/5 border border-ice/20 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] uppercase font-mono text-arctic flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5" /> AI Root Cause Analysis
              </h3>
              {!rootCause && !analyzing && (
                <button 
                  onClick={runAIAnalysis}
                  className="flex items-center gap-1.5 px-2 py-1 bg-ice/10 border border-ice/30 rounded text-[9px] font-mono text-arctic hover:bg-ice/20 transition-all"
                >
                  <Sparkles className="w-3 h-3" /> Run Analysis
                </button>
              )}
            </div>
            
            {analyzing ? (
              <div className="flex flex-col gap-3 py-2">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-arctic animate-spin" />
                  <span className="text-xs font-mono text-text-secondary animate-pulse">Correlating alerts and identifying patterns...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-ice/10 rounded w-3/4 animate-pulse" />
                  <div className="h-2 bg-ice/10 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ) : rootCause ? (
              <div className="text-xs text-text-secondary leading-relaxed space-y-2">
                <div className="flex items-start gap-2 bg-navy/40 p-2 rounded border border-border-subtle/50 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber mt-0.5 flex-shrink-0" />
                  <span className="text-[10px] font-mono text-amber">Potential Root Cause Identified</span>
                </div>
                <div className="prose prose-invert prose-xs max-w-none">
                  {rootCause.split('\n').map((line, i) => (
                    <p key={i} className="m-0">{line}</p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-text-secondary font-mono italic">
                Correlate {incident.correlatedAlerts?.length || 0} alerts to identify the primary attack vector.
              </p>
            )}
          </section>

          <section className="p-4 bg-navy/30 border border-border-subtle rounded-xl">
            <h3 className="text-[10px] uppercase font-mono text-arctic mb-2 flex items-center gap-2">
              <Zap className="w-3 h-3" /> AI Summary
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Anomaly detected in {incident.entity} involving unusual outbound traffic patterns. 
              The AI engine identifies a 94% probability of {incident.category.toLowerCase()} activity. 
              Recommended immediate containment of the affected endpoint and credential rotation for associated service accounts.
            </p>
          </section>

          {/* Correlated Alerts Section */}
          {incident.correlatedAlerts && incident.correlatedAlerts.length > 0 && (
            <section>
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-text-secondary">
                <Link className="w-4 h-4" /> Correlated Alerts ({incident.correlatedAlerts.length})
              </h3>
              <div className="flex flex-col gap-2">
                {incident.correlatedAlerts.map((alert: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-navy/20 border border-border-subtle rounded-lg hover:border-ice/30 transition-all cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-text-primary">{alert.title}</span>
                      <span className="text-[9px] font-mono text-text-secondary">{alert.source}</span>
                    </div>
                    <span className="text-[9px] font-mono text-text-secondary">{alert.time}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-arctic" /> Incident Timeline
            </h3>
            <div className="flex flex-col gap-4 border-l border-border-subtle ml-2 pl-6 relative">
              {[
                { time: '14m ago', event: 'Incident escalated to SOC Lead', user: 'System AI' },
                { time: '22m ago', event: 'Automated containment initiated', user: 'Sentinel-1' },
                { time: '25m ago', event: 'Anomaly threshold exceeded (94%)', user: 'NorthGuard ML' },
                { time: '28m ago', event: 'Initial detection of unusual traffic', user: 'Network Monitor' },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-ice border-2 border-[#0D1F47]" />
                  <div className="text-[10px] font-mono text-arctic mb-0.5">{item.time}</div>
                  <div className="text-xs font-medium mb-0.5">{item.event}</div>
                  <div className="text-[10px] text-text-secondary font-mono">Actor: {item.user}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-navy/30 border border-border-subtle rounded-xl">
              <h3 className="text-[10px] uppercase font-mono text-text-secondary mb-2">Risk Score</h3>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#E84040" strokeWidth="3" strokeDasharray="85, 100" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">85</div>
                </div>
                <span className="text-xs font-bold text-red">High Risk</span>
              </div>
            </div>
            <div className="p-4 bg-navy/30 border border-border-subtle rounded-xl">
              <h3 className="text-[10px] uppercase font-mono text-text-secondary mb-2">Affected Assets</h3>
              <div className="flex flex-col gap-1">
                <div className="text-xs font-mono text-arctic">1 Endpoint</div>
                <div className="text-xs font-mono text-arctic">2 Accounts</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold mb-3">Recommended Actions</h3>
            <div className="flex flex-col gap-2">
              {[
                'Isolate endpoint: RD-CORP-WS-042',
                'Rotate credentials for svc-corp-portal',
                'Initiate forensic memory dump',
                'Notify Compliance Officer (OSFI B-13)'
              ].map((action, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-ice/5 border border-ice/20 rounded-lg group hover:bg-ice/10 transition-all cursor-pointer">
                  <div className="w-5 h-5 rounded bg-ice/20 flex items-center justify-center text-[10px] font-bold text-arctic">{i + 1}</div>
                  <span className="text-xs group-hover:text-arctic transition-colors">{action}</span>
                  <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-border-subtle bg-navy/50 flex gap-3">
          <button className="flex-1 bg-ice text-navy font-bold py-2 rounded-lg text-xs hover:bg-arctic transition-all">Update Status</button>
          <button className="flex-1 border border-border-subtle text-text-primary font-bold py-2 rounded-lg text-xs hover:bg-white/5 transition-all">Add Comment</button>
          <button className="p-2 border border-border-subtle rounded-lg hover:bg-white/5 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

  const renderContent = () => {
    if (activeView === 'overview') {
      return (
        <div className="flex-1 flex flex-col gap-4">
          <div className="kpi-grid">
            {DATA.kpis.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 px-4">
            <div className="lg:col-span-2 h-[400px]">
              <ThreatIntelligence />
            </div>
            <div className="h-[400px]">
              <AlertFeed />
            </div>
          </div>

          <BottomPanels />

          <IncidentTable onRowClick={(inc) => setSelectedIncident(inc)} />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-ice/10 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-arctic animate-pulse" />
        </div>
        <h2 className="text-xl font-bold mb-2">Module: {activeView.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h2>
        <p className="text-sm text-text-secondary font-mono max-w-md">
          This module is currently processing real-time data from Royal Dominion Financial Group's core banking systems. 
          AI-driven insights will be available shortly.
        </p>
        <button 
          onClick={() => setActiveView('overview')}
          className="mt-6 px-4 py-2 bg-ice text-navy font-bold rounded-lg text-xs hover:bg-arctic transition-all"
        >
          Return to Overview
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-navy text-text-primary selection:bg-ice/30">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-navy border-b border-border-subtle z-[60] flex items-center px-4 gap-4">
        <div className="flex items-center gap-3 min-w-[220px]">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-white/5 rounded-md transition-all"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('overview')}>
            <Shield className="w-6 h-6 text-ice" />
            <div className="flex flex-col -gap-1">
              <span className="text-sm font-bold tracking-tight">NorthGuard AI</span>
              <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest">Financial Services</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-ice transition-colors" />
          <input 
            type="text" 
            placeholder="Search threats, incidents, entities, accounts..." 
            className="w-full bg-slate/40 border border-border-subtle rounded-lg pl-10 pr-4 py-1.5 text-xs font-mono focus:outline-none focus:border-ice/50 focus:ring-1 focus:ring-ice/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="text-[9px] font-mono text-text-secondary/50 border border-border-subtle px-1 rounded">⌘</kbd>
            <kbd className="text-[9px] font-mono text-text-secondary/50 border border-border-subtle px-1 rounded">K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-green/10 border border-green/30 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green pulse-green" />
            <span className="text-[10px] font-mono text-green font-bold">PROD — Royal Dominion FG</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green" />
            <div className="w-1.5 h-1.5 rounded-full bg-green" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber" />
            <span className="text-[10px] font-mono text-text-secondary ml-1">Systems Operational</span>
          </div>

          <button className="relative p-2 hover:bg-white/5 rounded-full transition-all">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-navy">7</span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold">Sarah Chen</span>
              <span className="text-[9px] font-mono text-text-secondary">CISO</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-ice flex items-center justify-center text-navy font-bold text-xs">
              SC
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        activeView={activeView} 
        setActiveView={setActiveView} 
      />

      {/* Main Content */}
      <main className={cn(
        "pt-14 transition-all duration-300 min-h-screen flex flex-col",
        collapsed ? "pl-16" : "pl-60"
      )}>
        {/* Page Header */}
        <div className="p-6 flex justify-between items-end border-b border-border-subtle bg-slate/10">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary mb-1">
              <span>NorthGuard AI</span>
              <span>/</span>
              <span>Security Operations</span>
              <span>/</span>
              <span className="text-arctic">{activeView === 'overview' ? 'Overview' : activeView.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {activeView === 'overview' ? 'Security Overview' : activeView.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </h1>
            <p className="text-xs text-text-secondary font-mono mt-1">
              Real-time monitoring for Royal Dominion Financial Group — As of {format(currentTime, 'MMM dd, yyyy · HH:mm:ss')} EDT
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-ice/10 border border-ice/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green pulse-green" />
              <span className="text-[11px] font-mono text-green font-bold uppercase tracking-wider">Live</span>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={() => window.location.reload()}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Footer */}
        <footer className="mt-auto border-t border-border-subtle bg-slate/10">
          <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-ice" />
                <span className="text-sm font-bold tracking-tight">NorthGuard AI</span>
              </div>
              <p className="text-[10px] font-mono text-text-secondary leading-relaxed max-w-xs">
                The leading AI-driven cybersecurity and compliance platform for the Canadian financial services industry. 
                Securing the future of banking through intelligent threat detection and regulatory automation.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-arctic mb-4">Regulatory Links</h4>
              <ul className="flex flex-col gap-2 text-[10px] font-mono text-text-secondary">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('osfi-compliance'); }} className="hover:text-arctic transition-colors">OSFI Guideline B-13</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('fintrac-reporting'); }} className="hover:text-arctic transition-colors">FINTRAC PCMLTFA Compliance</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('osfi-compliance'); }} className="hover:text-arctic transition-colors">OSFI Guideline B-10</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('audit-governance'); }} className="hover:text-arctic transition-colors">CSA Cybersecurity Disclosure</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-arctic mb-4">Platform</h4>
              <ul className="flex flex-col gap-2 text-[10px] font-mono text-text-secondary">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('threat-center'); }} className="hover:text-arctic transition-colors">Threat Center</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('fraud-detection'); }} className="hover:text-arctic transition-colors">Fraud Detection</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('identity-mgmt'); }} className="hover:text-arctic transition-colors">Identity & Access</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setActiveView('ai-insights'); }} className="hover:text-arctic transition-colors">AI Insights</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-arctic mb-4">Support & Legal</h4>
              <ul className="flex flex-col gap-2 text-[10px] font-mono text-text-secondary">
                <li><a href="#" className="hover:text-arctic transition-colors">24/7 Incident Support</a></li>
                <li><a href="#" className="hover:text-arctic transition-colors">Documentation Portal</a></li>
                <li><a href="#" className="hover:text-arctic transition-colors">Privacy & Data Residency</a></li>
                <li><a href="#" className="hover:text-arctic transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="p-4 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-mono text-text-secondary px-8">
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <span>© 2025 NorthGuard AI Technologies Inc.</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> HQ: Toronto, ON, Canada</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Data residency: Canada-East (Toronto)</span>
            </div>
            <div className="flex gap-3">
              <span className="px-2 py-0.5 border border-border-subtle rounded bg-slate/20">SOC 2 TYPE II</span>
              <span className="px-2 py-0.5 border border-border-subtle rounded bg-slate/20">ISO 27001:2022</span>
              <span className="px-2 py-0.5 border border-border-subtle rounded bg-slate/20">PCI DSS COMPLIANT</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Incident Detail Drawer */}
      <IncidentDrawer 
        incident={selectedIncident} 
        onClose={() => setSelectedIncident(null)} 
      />
    </div>
  );
}
