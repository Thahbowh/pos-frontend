import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from "recharts";

/* ══════════════════════════════════════════════
   DESIGN TOKENS & GLOBAL STYLES
══════════════════════════════════════════════ */
const style = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-void: #080810;
    --bg-deep: #0d0d1a;
    --bg-card: #11111f;
    --bg-card2: #161628;
    --bg-hover: #1a1a30;
    --gold: #c9a84c;
    --gold-bright: #f0c040;
    --gold-dim: #7a6530;
    --gold-glow: rgba(201,168,76,0.18);
    --gold-glow2: rgba(240,192,64,0.08);
    --red: #e03e3e;
    --red-dim: rgba(224,62,62,0.15);
    --green: #2ecc71;
    --green-dim: rgba(46,204,113,0.12);
    --orange: #e67e22;
    --orange-dim: rgba(230,126,34,0.12);
    --blue: #3498db;
    --blue-dim: rgba(52,152,219,0.12);
    --purple: #9b59b6;
    --text-primary: #f0e6c8;
    --text-secondary: #9a8e72;
    --text-muted: #55504a;
    --border: rgba(201,168,76,0.15);
    --border-bright: rgba(201,168,76,0.35);
    --shadow-gold: 0 0 30px rgba(201,168,76,0.12);
    --shadow-card: 0 4px 24px rgba(0,0,0,0.5);
    --radius: 10px;
    --radius-lg: 16px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Rajdhani', sans-serif;
    background: var(--bg-void);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .cinzel { font-family: 'Cinzel', serif; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg-deep); }
  ::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 2px; }

  /* Animations */
  @keyframes pulse-gold {
    0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
  }
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink-red {
    0%,100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .fade-in { animation: fadeSlideIn 0.35s ease both; }

  /* Nav */
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: var(--radius);
    cursor: pointer; transition: all 0.2s;
    font-size: 13px; font-weight: 600; letter-spacing: 0.5px;
    color: var(--text-secondary); position: relative;
    text-transform: uppercase;
  }
  .nav-item:hover { background: var(--gold-glow2); color: var(--text-primary); }
  .nav-item.active {
    background: var(--gold-glow);
    color: var(--gold);
    border: 1px solid var(--border);
  }
  .nav-item.active::before {
    content: '';
    position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; background: var(--gold);
    border-radius: 0 2px 2px 0;
  }

  /* Cards */
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    box-shadow: var(--shadow-card);
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
  }
  .card-glow { box-shadow: var(--shadow-card), var(--shadow-gold); }

  /* Stat cards */
  .stat-val {
    font-family: 'Cinzel', serif;
    font-size: 28px; font-weight: 700;
    color: var(--gold-bright); line-height: 1;
  }
  .stat-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .stat-delta { font-size: 12px; margin-top: 6px; }

  /* Badge */
  .badge {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 2px 8px; border-radius: 20px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
  }
  .badge-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(224,62,62,0.3); }
  .badge-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(46,204,113,0.3); }
  .badge-orange { background: var(--orange-dim); color: var(--orange); border: 1px solid rgba(230,126,34,0.3); }
  .badge-gold { background: var(--gold-glow); color: var(--gold); border: 1px solid var(--border); }
  .badge-blue { background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(52,152,219,0.3); }
  .badge-purple { background: rgba(155,89,182,0.15); color: var(--purple); border: 1px solid rgba(155,89,182,0.3); }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th {
    text-align: left; padding: 10px 14px;
    font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
    color: var(--text-muted); border-bottom: 1px solid var(--border);
    font-family: 'Rajdhani', sans-serif; font-weight: 600;
  }
  .data-table td {
    padding: 11px 14px; border-bottom: 1px solid rgba(201,168,76,0.06);
    color: var(--text-primary); vertical-align: middle;
  }
  .data-table tr:hover td { background: var(--gold-glow2); }
  .data-table tr.alert-row td { background: rgba(224,62,62,0.05); }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: var(--radius);
    font-family: 'Rajdhani', sans-serif; font-weight: 600;
    font-size: 13px; letter-spacing: 0.5px; cursor: pointer;
    border: none; transition: all 0.2s; text-transform: uppercase;
  }
  .btn-gold {
    background: linear-gradient(135deg, var(--gold) 0%, #a07828 100%);
    color: #0d0d1a; box-shadow: 0 2px 12px rgba(201,168,76,0.3);
  }
  .btn-gold:hover { filter: brightness(1.15); transform: translateY(-1px); }
  .btn-outline {
    background: transparent; color: var(--gold);
    border: 1px solid var(--border-bright);
  }
  .btn-outline:hover { background: var(--gold-glow); }
  .btn-red {
    background: rgba(224,62,62,0.15); color: var(--red);
    border: 1px solid rgba(224,62,62,0.4);
  }
  .btn-red:hover { background: rgba(224,62,62,0.25); }
  .btn-sm { padding: 5px 10px; font-size: 11px; }

  /* Risk bar */
  .risk-bar { height: 6px; border-radius: 3px; background: var(--bg-hover); overflow: hidden; }
  .risk-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

  /* Alert pulse */
  .alert-pulse { animation: pulse-gold 2s infinite; }
  .blink { animation: blink-red 1.5s infinite; }

  /* Toast */
  .toast-container {
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    display: flex; flex-direction: column; gap: 8px; pointer-events: none;
  }
  .toast {
    background: var(--bg-card2); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 12px 16px;
    font-size: 13px; min-width: 280px; max-width: 360px;
    animation: fadeSlideIn 0.3s ease both;
    pointer-events: all; display: flex; align-items: center; gap: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  }
  .toast-red { border-left: 3px solid var(--red); }
  .toast-gold { border-left: 3px solid var(--gold); }
  .toast-green { border-left: 3px solid var(--green); }

  /* Section header */
  .section-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
  }
  .section-header h2 {
    font-family: 'Cinzel', serif; font-size: 18px;
    font-weight: 700; color: var(--text-primary); letter-spacing: 1px;
  }
  .section-header .divider {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, var(--border), transparent);
  }

  /* Input */
  .input-dark {
    background: var(--bg-deep); border: 1px solid var(--border);
    color: var(--text-primary); border-radius: var(--radius);
    padding: 8px 12px; font-family: 'Rajdhani', sans-serif;
    font-size: 13px; outline: none; transition: border-color 0.2s;
  }
  .input-dark:focus { border-color: var(--gold-dim); }
  .input-dark::placeholder { color: var(--text-muted); }

  select.input-dark option { background: var(--bg-deep); }

  /* Modal */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
  }
  .modal {
    background: var(--bg-card2); border: 1px solid var(--border-bright);
    border-radius: var(--radius-lg); padding: 28px;
    max-width: 600px; width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.8), var(--shadow-gold);
    animation: fadeSlideIn 0.3s ease both;
  }

  /* Ticker */
  .ticker-wrap {
    overflow: hidden; white-space: nowrap;
    background: linear-gradient(90deg, var(--bg-deep), var(--bg-card), var(--bg-deep));
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    padding: 8px 0; font-size: 12px; color: var(--text-secondary);
  }
  .ticker-content { display: inline-block; animation: ticker 30s linear infinite; }

  /* Investigation */
  .investigation-banner {
    background: linear-gradient(135deg, rgba(224,62,62,0.2), rgba(224,62,62,0.05));
    border: 1px solid rgba(224,62,62,0.5); border-radius: var(--radius-lg);
    padding: 20px; display: flex; align-items: center; gap: 16px;
    animation: pulse-gold 3s infinite;
  }

  /* Grid helpers */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  @media(max-width: 900px) {
    .grid-4 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr; }
    .grid-2 { grid-template-columns: 1fr; }
  }

  /* Scrollable table container */
  .table-wrap { overflow-x: auto; border-radius: var(--radius); }

  /* Skeleton */
  .skeleton {
    background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  /* Hexagon risk */
  .risk-critical { color: var(--red); }
  .risk-high { color: var(--orange); }
  .risk-medium { color: #f1c40f; }
  .risk-low { color: var(--green); }

  /* Timeline */
  .timeline-item {
    display: flex; gap: 12px; padding: 10px 0;
    border-bottom: 1px solid rgba(201,168,76,0.06);
  }
  .timeline-dot {
    width: 10px; height: 10px; border-radius: 50%;
    margin-top: 5px; flex-shrink: 0;
  }

  /* Tag */
  .tag {
    display: inline-block; padding: 2px 6px; border-radius: 4px;
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* Scanline overlay */
  .scanline-overlay {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    overflow: hidden; opacity: 0.03;
  }
  .scanline-overlay::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--gold-bright);
    animation: scanline 8s linear infinite;
  }
`;

/* ══════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════ */
const EMPLOYEES = [
  { id: "E001", name: "John Mokoena", role: "Bartender", shift: "Night", riskScore: 84, avatar: "JM" },
  { id: "E002", name: "Sarah Dlamini", role: "Cashier", shift: "Day", riskScore: 12, avatar: "SD" },
  { id: "E003", name: "Peter Nkosi", role: "Stock Controller", shift: "Day", riskScore: 31, avatar: "PN" },
  { id: "E004", name: "Linda Botha", role: "Manager", shift: "Day", riskScore: 5, avatar: "LB" },
  { id: "E005", name: "Marcus van Wyk", role: "Bartender", shift: "Night", riskScore: 67, avatar: "MW" },
];

const PRODUCTS = [
  { id: "P001", name: "Castle Lite 330ml", barcode: "6001007000026", category: "Beer", price: 28, stock: 142, unit: "bottle" },
  { id: "P002", name: "Heineken 330ml", barcode: "8710398522337", category: "Beer", price: 35, stock: 88, unit: "bottle" },
  { id: "P003", name: "Jameson Whiskey 750ml", barcode: "5011007003265", category: "Spirits", price: 380, stock: 14, unit: "bottle" },
  { id: "P004", name: "Savanna Dry 330ml", barcode: "6001007001046", category: "Cider", price: 30, stock: 96, unit: "bottle" },
  { id: "P005", name: "Absolut Vodka 750ml", barcode: "7312040017072", category: "Spirits", price: 290, stock: 8, unit: "bottle" },
  { id: "P006", name: "Flying Fish 330ml", barcode: "6001007002133", category: "Beer", price: 32, stock: 204, unit: "bottle" },
];

const MOVEMENTS = [
  { id: "SM-0091", ts: "2025-05-16 23:47", emp: "John Mokoena", empId: "E001", product: "Castle Lite 330ml", type: "SOLD", qty: -3, before: 145, after: 142, reason: "Sale #4821", status: "AUTO", ip: "192.168.1.4" },
  { id: "SM-0090", ts: "2025-05-16 23:31", emp: "John Mokoena", empId: "E001", product: "Jameson Whiskey 750ml", type: "ADJUSTMENT", qty: -2, before: 16, after: 14, reason: "Manual stock edit", status: "FLAGGED", ip: "192.168.1.4" },
  { id: "SM-0089", ts: "2025-05-16 22:15", emp: "Marcus van Wyk", empId: "E005", product: "Absolut Vodka 750ml", type: "DAMAGE", qty: -1, before: 9, after: 8, reason: "Broken bottle", status: "PENDING", ip: "192.168.1.6" },
  { id: "SM-0088", ts: "2025-05-16 21:44", emp: "Sarah Dlamini", empId: "E002", product: "Heineken 330ml", type: "SOLD", qty: -4, before: 92, after: 88, reason: "Sale #4820", status: "AUTO", ip: "192.168.1.3" },
  { id: "SM-0087", ts: "2025-05-16 20:02", emp: "Peter Nkosi", empId: "E003", product: "Castle Lite 330ml", type: "RECEIVED", qty: +24, before: 121, after: 145, reason: "Delivery INV-2241", status: "APPROVED", ip: "192.168.1.5" },
  { id: "SM-0086", ts: "2025-05-16 19:55", emp: "John Mokoena", empId: "E001", product: "Savanna Dry 330ml", type: "SOLD", qty: -2, before: 98, after: 96, reason: "Sale #4818", status: "AUTO", ip: "192.168.1.4" },
  { id: "SM-0085", ts: "2025-05-16 19:12", emp: "Marcus van Wyk", empId: "E005", product: "Castle Lite 330ml", type: "DAMAGE", qty: -3, before: 124, after: 121, reason: "Customer spill", status: "PENDING", ip: "192.168.1.6" },
  { id: "SM-0084", ts: "2025-05-16 18:30", emp: "John Mokoena", empId: "E001", product: "Flying Fish 330ml", type: "VOID", qty: +2, before: 202, after: 204, reason: "Transaction cancelled", status: "FLAGGED", ip: "192.168.1.4" },
];

const DAMAGE_REPORTS = [
  { id: "DR-0041", ts: "2025-05-16 23:31", emp: "Marcus van Wyk", empId: "E005", product: "Absolut Vodka 750ml", qty: 1, value: 290, category: "Broken bottle", status: "PENDING", photo: true, location: "Bar Counter", barcode: "7312040017072" },
  { id: "DR-0040", ts: "2025-05-16 19:12", emp: "Marcus van Wyk", empId: "E005", product: "Castle Lite 330ml", qty: 3, value: 84, category: "Customer spill", status: "PENDING", photo: true, location: "Table 7", barcode: "6001007000026" },
  { id: "DR-0039", ts: "2025-05-15 22:44", emp: "John Mokoena", empId: "E001", product: "Jameson Whiskey 750ml", qty: 2, value: 760, category: "Broken bottle", status: "SUSPICIOUS", photo: false, location: "Storage", barcode: "5011007003265" },
  { id: "DR-0038", ts: "2025-05-15 20:10", emp: "John Mokoena", empId: "E001", product: "Castle Lite 330ml", qty: 6, value: 168, category: "Leakage", status: "APPROVED", photo: true, location: "Fridge", barcode: "6001007000026" },
  { id: "DR-0037", ts: "2025-05-14 21:30", emp: "John Mokoena", empId: "E001", product: "Heineken 330ml", qty: 4, value: 140, category: "Expired", status: "APPROVED", photo: true, location: "Storage", barcode: "8710398522337" },
];

const AUDIT_LOGS = [
  { id: "AL-1847", ts: "2025-05-16 23:47", user: "SYSTEM", action: "STOCK_MOVEMENT", entity: "Castle Lite 330ml", old: "145", new: "142", reason: "Sale #4821", ip: "192.168.1.4", severity: "info" },
  { id: "AL-1846", ts: "2025-05-16 23:31", user: "John Mokoena", action: "MANUAL_ADJUSTMENT", entity: "Jameson Whiskey 750ml", old: "16", new: "14", reason: "Manual stock edit", ip: "192.168.1.4", severity: "critical" },
  { id: "AL-1845", ts: "2025-05-16 23:31", user: "SYSTEM", action: "THEFT_ALERT_GENERATED", entity: "E001 - John Mokoena", old: "—", new: "84% Risk", reason: "Pattern detected", ip: "SYSTEM", severity: "critical" },
  { id: "AL-1844", ts: "2025-05-16 22:15", user: "Marcus van Wyk", action: "DAMAGE_REPORTED", entity: "Absolut Vodka 750ml", old: "9", new: "PENDING", reason: "Broken bottle", ip: "192.168.1.6", severity: "warning" },
  { id: "AL-1843", ts: "2025-05-16 21:44", user: "Sarah Dlamini", action: "STOCK_MOVEMENT", entity: "Heineken 330ml", old: "92", new: "88", reason: "Sale #4820", ip: "192.168.1.3", severity: "info" },
  { id: "AL-1842", ts: "2025-05-16 20:02", user: "Peter Nkosi", action: "DELIVERY_RECEIVED", entity: "Castle Lite 330ml", old: "121", new: "145", reason: "INV-2241", ip: "192.168.1.5", severity: "info" },
  { id: "AL-1841", ts: "2025-05-16 19:55", user: "John Mokoena", action: "VOID_TRANSACTION", entity: "Flying Fish 330ml", old: "202", new: "204", reason: "Transaction cancelled", ip: "192.168.1.4", severity: "warning" },
  { id: "AL-1840", ts: "2025-05-16 18:30", user: "Linda Botha", action: "LOGIN", entity: "Manager Dashboard", old: "—", new: "—", reason: "Normal login", ip: "192.168.1.2", severity: "info" },
];

const RECONCILIATION = [
  { product: "Castle Lite 330ml", opening: 121, delivered: 24, sold: 40, damaged: 9, expected: 96, physical: 142, variance: +46, value: 1288, risk: "low" },
  { product: "Jameson Whiskey 750ml", opening: 18, delivered: 0, sold: 2, damaged: 2, expected: 14, physical: 14, variance: 0, value: 0, risk: "low" },
  { product: "Absolut Vodka 750ml", opening: 12, delivered: 0, sold: 3, damaged: 1, expected: 8, physical: 8, variance: 0, value: 0, risk: "low" },
  { product: "Heineken 330ml", opening: 100, delivered: 0, sold: 12, damaged: 0, expected: 88, physical: 82, variance: -6, value: -210, risk: "high" },
  { product: "Savanna Dry 330ml", opening: 110, delivered: 0, sold: 14, damaged: 0, expected: 96, physical: 89, variance: -7, value: -210, risk: "high" },
  { product: "Flying Fish 330ml", opening: 210, delivered: 0, sold: 8, damaged: 0, expected: 202, physical: 204, variance: +2, value: +64, risk: "low" },
];

const THEFT_ALERTS = [
  { id: "TA-0021", ts: "2025-05-16 23:45", emp: "John Mokoena", empId: "E001", type: "MANUAL_EDIT_PATTERN", description: "3 manual stock adjustments in 24hrs without manager approval", severity: "critical", product: "Multiple", status: "OPEN" },
  { id: "TA-0020", ts: "2025-05-16 22:30", emp: "Marcus van Wyk", empId: "E005", type: "EXCESSIVE_DAMAGE", description: "4 damage reports in 48hrs — total value R894", severity: "high", product: "Beer/Spirits", status: "OPEN" },
  { id: "TA-0019", ts: "2025-05-16 19:50", emp: "John Mokoena", empId: "E001", type: "VOID_ABUSE", description: "Voided transaction after close — Flying Fish 330ml ×2", severity: "high", product: "Flying Fish 330ml", status: "INVESTIGATING" },
  { id: "TA-0018", ts: "2025-05-15 23:10", emp: "John Mokoena", empId: "E001", type: "REPEATED_SHORTAGE", description: "Heineken 330ml short 6 units — 3rd occurrence this week", severity: "critical", product: "Heineken 330ml", status: "OPEN" },
  { id: "TA-0017", ts: "2025-05-15 21:00", emp: "Marcus van Wyk", empId: "E005", type: "STOCK_WITHOUT_SALES", description: "Stock decreased with no corresponding sale transaction", severity: "medium", product: "Savanna Dry 330ml", status: "RESOLVED" },
];

const RISK_DATA = [
  { name: "John M.", score: 84, voids: 7, damage: 9, edits: 5, shortages: 4 },
  { name: "Marcus V.", score: 67, voids: 3, damage: 4, edits: 1, shortages: 3 },
  { name: "Peter N.", score: 31, voids: 1, damage: 0, edits: 2, shortages: 1 },
  { name: "Sarah D.", score: 12, voids: 0, damage: 1, edits: 0, shortages: 0 },
  { name: "Linda B.", score: 5, voids: 0, damage: 0, edits: 0, shortages: 0 },
];

const THEFT_TREND = [
  { day: "Mon", alerts: 1, losses: 0, voids: 2 },
  { day: "Tue", alerts: 2, losses: 1, voids: 1 },
  { day: "Wed", alerts: 1, losses: 0, voids: 3 },
  { day: "Thu", alerts: 4, losses: 2, voids: 5 },
  { day: "Fri", alerts: 6, losses: 3, voids: 4 },
  { day: "Sat", alerts: 8, losses: 5, voids: 7 },
  { day: "Sun", alerts: 5, losses: 4, voids: 3 },
];

const REFUND_LOGS = [
  { id: "RF-0044", ts: "2025-05-16 23:00", emp: "John Mokoena", product: "Castle Lite 330ml", qty: 2, value: 56, reason: "Customer complaint", approvedBy: "Linda Botha", status: "APPROVED" },
  { id: "RF-0043", ts: "2025-05-16 21:30", emp: "Marcus van Wyk", product: "Flying Fish 330ml", qty: 3, value: 96, reason: "Wrong order", approvedBy: "PENDING", status: "FLAGGED" },
  { id: "RF-0042", ts: "2025-05-16 20:15", emp: "John Mokoena", product: "Jameson Whiskey 750ml", qty: 1, value: 380, reason: "Customer complaint", approvedBy: "PENDING", status: "SUSPICIOUS" },
  { id: "RF-0041", ts: "2025-05-15 22:00", emp: "Sarah Dlamini", product: "Heineken 330ml", qty: 2, value: 70, reason: "Wrong order", approvedBy: "Linda Botha", status: "APPROVED" },
];

const RADAR_DATA = [
  { subject: "Voids", A: 84, fullMark: 100 },
  { subject: "Damage", A: 72, fullMark: 100 },
  { subject: "Edits", A: 90, fullMark: 100 },
  { subject: "Shortages", A: 78, fullMark: 100 },
  { subject: "Refunds", A: 60, fullMark: 100 },
  { subject: "Off-hours", A: 85, fullMark: 100 },
];

/* ══════════════════════════════════════════════
   HELPER COMPONENTS
══════════════════════════════════════════════ */
function Avatar({ initials, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, var(--gold-dim), #3a2e10)",
      border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 700, color: "var(--gold)",
      flexShrink: 0, fontFamily: "'Rajdhani', sans-serif"
    }}>{initials}</div>
  );
}

function RiskScore({ score }) {
  const color = score >= 70 ? "var(--red)" : score >= 40 ? "var(--orange)" : score >= 20 ? "#f1c40f" : "var(--green)";
  const label = score >= 70 ? "CRITICAL" : score >= 40 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80 }}>
        <div className="risk-bar">
          <div className="risk-fill" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
        </div>
      </div>
      <span style={{ color, fontSize: 12, fontWeight: 700, minWidth: 28 }}>{score}%</span>
      <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44`, fontSize: 9 }}>{label}</span>
    </div>
  );
}

function MovTypeBadge({ type }) {
  const map = {
    SOLD: "badge-green", RECEIVED: "badge-blue", DAMAGE: "badge-orange",
    ADJUSTMENT: "badge-red", VOID: "badge-red", TRANSFERRED: "badge-purple",
    STOCKTAKE: "badge-gold", WASTED: "badge-orange"
  };
  return <span className={`badge ${map[type] || "badge-gold"}`}>{type}</span>;
}

function SeverityBadge({ sev }) {
  const map = { critical: "badge-red", warning: "badge-orange", info: "badge-gold" };
  return <span className={`badge ${map[sev] || "badge-gold"}`}>{sev}</span>;
}

function StatusBadge({ status }) {
  const map = {
    APPROVED: "badge-green", PENDING: "badge-orange", FLAGGED: "badge-red",
    SUSPICIOUS: "badge-red", AUTO: "badge-blue", OPEN: "badge-red",
    INVESTIGATING: "badge-orange", RESOLVED: "badge-green"
  };
  return <span className={`badge ${map[status] || "badge-gold"}`}>{status}</span>;
}

function GoldIcon({ emoji, size = 20 }) {
  return <span style={{ fontSize: size }}>{emoji}</span>;
}

function SectionHeader({ icon, title, sub, children }) {
  return (
    <div className="section-header" style={{ flexWrap: "wrap", gap: 8 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div>
        <h2 className="cinzel" style={{ fontSize: 18, color: "var(--text-primary)", letterSpacing: 1 }}>{title}</h2>
        {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="divider" style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)", marginLeft: 8 }} />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAGES
══════════════════════════════════════════════ */

/* ── DASHBOARD ── */
function Dashboard({ onToast, onAlert }) {
  const totalAlerts = THEFT_ALERTS.filter(a => a.status === "OPEN").length;
  const pendingDamage = DAMAGE_REPORTS.filter(d => d.status === "PENDING").length;
  const pendingRefunds = REFUND_LOGS.filter(r => r.status !== "APPROVED").length;
  const totalLoss = RECONCILIATION.filter(r => r.variance < 0).reduce((s, r) => s + Math.abs(r.value), 0);

  useEffect(() => {
    const t = setTimeout(() => onToast("🚨 New theft alert: John Mokoena — Manual stock adjustment detected", "red"), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">

      {/* Investigation Banner */}
      <div className="investigation-banner">
        <span style={{ fontSize: 32 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <div className="cinzel" style={{ color: "var(--red)", fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>
            ⚠ MANDATORY INVESTIGATION MODE ACTIVE
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Stock loss exceeds R500 threshold — All adjustments locked. Manager + Owner approval required. Incident #INV-0007
          </div>
        </div>
        <button className="btn btn-red btn-sm" onClick={() => onAlert("Investigation modal opened")}>
          VIEW REPORT
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid-4">
        {[
          { label: "Active Theft Alerts", val: totalAlerts, delta: "+2 today", color: "var(--red)", icon: "🚨" },
          { label: "Stock Variance Today", val: `R${totalLoss.toLocaleString()}`, delta: "Unexplained loss", color: "var(--orange)", icon: "📉" },
          { label: "Pending Approvals", val: pendingDamage + pendingRefunds, delta: `${pendingDamage} damage, ${pendingRefunds} refunds`, color: "var(--gold)", icon: "⏳" },
          { label: "Risk Score (Avg)", val: "37%", delta: "John M. at 84% ⚠", color: "var(--purple)", icon: "🧠" },
        ].map((s, i) => (
          <div key={i} className="card card-glow" style={{ borderColor: s.color + "44" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{s.label}</div>
                <div className="stat-val" style={{ color: s.color, fontSize: 26 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{s.delta}</div>
              </div>
              <div style={{ fontSize: 28, opacity: 0.7 }}>{s.icon}</div>
            </div>
            {i === 0 && <div style={{
              position: "absolute", top: 10, right: 10,
              width: 8, height: 8, borderRadius: "50%", background: "var(--red)"
            }} className="alert-pulse blink" />}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2">
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            📊 Weekly Theft Activity
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={THEFT_TREND}>
              <defs>
                <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.07)" />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 12 }} />
              <Area type="monotone" dataKey="alerts" stroke="var(--red)" fill="url(#alertGrad)" strokeWidth={2} name="Alerts" />
              <Area type="monotone" dataKey="losses" stroke="var(--gold)" fill="url(#lossGrad)" strokeWidth={2} name="Losses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            👤 Employee Risk Scores
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={RISK_DATA} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.07)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} width={60} />
              <Tooltip contentStyle={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" name="Risk %" radius={[0, 4, 4, 0]}>
                {RISK_DATA.map((e, i) => (
                  <Cell key={i} fill={e.score >= 70 ? "var(--red)" : e.score >= 40 ? "var(--orange)" : e.score >= 20 ? "#f1c40f" : "var(--green)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Feed + Suspicious Employees */}
      <div className="grid-2">
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            ⚡ Live Audit Feed
          </div>
          {AUDIT_LOGS.slice(0, 5).map((log, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-dot" style={{
                background: log.severity === "critical" ? "var(--red)" : log.severity === "warning" ? "var(--orange)" : "var(--gold-dim)"
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  <span style={{ color: "var(--gold)", fontWeight: 600 }}>{log.user}</span>
                  {" "}{log.action.replace(/_/g, " ").toLowerCase()}
                  {" on "}<span style={{ color: "var(--text-primary)" }}>{log.entity}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{log.ts} · {log.ip}</div>
              </div>
              <SeverityBadge sev={log.severity} />
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            🎯 Suspicious Employees
          </div>
          {EMPLOYEES.filter(e => e.riskScore > 20).sort((a, b) => b.riskScore - a.riskScore).map((emp, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
              <Avatar initials={emp.avatar} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{emp.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{emp.role} · {emp.shift} Shift</div>
              </div>
              <RiskScore score={emp.riskScore} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="card">
        <SectionHeader icon="📋" title="Recent Stock Movements" sub="Last 8 transactions" />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Time</th><th>Employee</th><th>Product</th><th>Type</th>
                <th>Qty</th><th>Before → After</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOVEMENTS.slice(0, 6).map((m, i) => (
                <tr key={i} className={m.status === "FLAGGED" ? "alert-row" : ""}>
                  <td><span style={{ color: "var(--gold)", fontSize: 12 }}>{m.id}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.ts.split(" ")[1]}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar initials={m.emp.split(" ").map(n => n[0]).join("")} size={24} />
                      <span style={{ fontSize: 13 }}>{m.emp}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{m.product}</td>
                  <td><MovTypeBadge type={m.type} /></td>
                  <td style={{ color: m.qty < 0 ? "var(--red)" : "var(--green)", fontWeight: 700 }}>
                    {m.qty > 0 ? "+" : ""}{m.qty}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {m.before} → <span style={{ color: "var(--text-primary)" }}>{m.after}</span>
                  </td>
                  <td><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── STOCK LEDGER ── */
function StockLedger() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const filtered = MOVEMENTS.filter(m =>
    (typeFilter === "ALL" || m.type === typeFilter) &&
    (m.product.toLowerCase().includes(search.toLowerCase()) || m.emp.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
      <SectionHeader icon="📒" title="Stock Movement Ledger" sub="Immutable transaction log — every movement recorded">
        <button className="btn btn-outline btn-sm">⬇ Export CSV</button>
      </SectionHeader>

      {/* Filters */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input className="input-dark" placeholder="🔍 Search product, employee..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
          {["ALL", "SOLD", "RECEIVED", "DAMAGE", "ADJUSTMENT", "VOID"].map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? "btn-gold" : "btn-outline"}`} onClick={() => setTypeFilter(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Movement ID</th><th>Timestamp</th><th>Employee</th><th>Product</th>
                <th>Barcode</th><th>Type</th><th>Qty</th><th>Before</th><th>After</th>
                <th>Reason</th><th>Status</th><th>IP/Device</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={i} className={m.status === "FLAGGED" ? "alert-row" : ""}>
                  <td><span style={{ color: "var(--gold)", fontFamily: "monospace", fontSize: 12 }}>{m.id}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{m.ts}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar initials={m.emp.split(" ").map(n => n[0]).join("")} size={24} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{m.emp}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{m.empId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{m.product}</td>
                  <td style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {PRODUCTS.find(p => p.name === m.product)?.barcode || "—"}
                  </td>
                  <td><MovTypeBadge type={m.type} /></td>
                  <td style={{ color: m.qty < 0 ? "var(--red)" : "var(--green)", fontWeight: 700, fontSize: 14 }}>
                    {m.qty > 0 ? "+" : ""}{m.qty}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.before}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{m.after}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 160 }}>{m.reason}</td>
                  <td><StatusBadge status={m.status} /></td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{m.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, padding: "8px 0", borderTop: "1px solid var(--border)" }}>
          🔒 This ledger is immutable. Records cannot be deleted or overwritten. {filtered.length} records shown.
        </div>
      </div>
    </div>
  );
}

/* ── DAMAGE REPORTS ── */
function DamageReports({ onToast }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ product: "", qty: "", category: "", location: "", barcode: "", notes: "" });

  const submit = () => {
    setShowModal(false);
    onToast("✅ Damage report submitted — Awaiting manager approval", "gold");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
      <SectionHeader icon="⚠️" title="Damage Reports" sub="All reports require manager approval before stock is adjusted">
        <button className="btn btn-gold btn-sm" onClick={() => setShowModal(true)}>+ New Report</button>
      </SectionHeader>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: "Pending Approval", val: DAMAGE_REPORTS.filter(d => d.status === "PENDING").length, color: "var(--orange)" },
          { label: "Suspicious Reports", val: DAMAGE_REPORTS.filter(d => d.status === "SUSPICIOUS").length, color: "var(--red)" },
          { label: "Approved This Week", val: DAMAGE_REPORTS.filter(d => d.status === "APPROVED").length, color: "var(--green)" },
          { label: "Total Value at Risk", val: `R${DAMAGE_REPORTS.filter(d => d.status !== "APPROVED").reduce((s, d) => s + d.value, 0).toLocaleString()}`, color: "var(--gold)" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ borderColor: s.color + "33" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{s.label}</div>
            <div className="cinzel" style={{ color: s.color, fontSize: 26, fontWeight: 700 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report ID</th><th>Timestamp</th><th>Employee</th><th>Product</th>
                <th>Category</th><th>Qty</th><th>Value</th><th>Photo</th><th>Location</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {DAMAGE_REPORTS.map((d, i) => (
                <tr key={i} className={d.status === "SUSPICIOUS" || d.status === "PENDING" ? "alert-row" : ""}>
                  <td><span style={{ color: "var(--gold)", fontSize: 12 }}>{d.id}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.ts}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar initials={d.emp.split(" ").map(n => n[0]).join("")} size={24} />
                      <span style={{ fontSize: 12 }}>{d.emp}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{d.product}</td>
                  <td>
                    <span className="badge badge-orange">{d.category}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{d.qty}</td>
                  <td style={{ color: "var(--orange)", fontWeight: 700 }}>R{d.value}</td>
                  <td>
                    {d.photo
                      ? <span style={{ color: "var(--green)", fontSize: 14 }}>✅ Uploaded</span>
                      : <span style={{ color: "var(--red)", fontSize: 14 }}>❌ Missing</span>}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{d.location}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    {d.status === "PENDING" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-sm" style={{ background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(46,204,113,0.3)", padding: "4px 8px", fontSize: 10 }}
                          onClick={() => onToast("✅ Damage report approved — stock updated", "gold")}>
                          APPROVE
                        </button>
                        <button className="btn btn-red btn-sm" onClick={() => onToast("🚨 Report flagged for investigation", "red")}>FLAG</button>
                      </div>
                    )}
                    {d.status !== "PENDING" && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning */}
      <div className="card" style={{ borderColor: "rgba(224,62,62,0.4)", background: "rgba(224,62,62,0.05)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, color: "var(--red)", marginBottom: 4 }}>THEFT PATTERN DETECTED</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              John Mokoena has submitted 7 damage reports in the past 5 days totaling R1,312.
              DR-0039 was submitted without a photo. Castle Lite appears in 4 of these reports — all during night shift.
              Manual adjustment detected on same products. <strong style={{ color: "var(--red)" }}>Recommend immediate investigation.</strong>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="cinzel" style={{ fontSize: 18, marginBottom: 20, color: "var(--gold)" }}>📷 Submit Damage Report</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Product Barcode *", key: "barcode", placeholder: "Scan or enter barcode" },
                { label: "Quantity *", key: "qty", placeholder: "e.g. 2" },
                { label: "Location *", key: "location", placeholder: "e.g. Bar Counter" },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === "barcode" ? "1 / -1" : "auto" }}>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input className="input-dark" placeholder={f.placeholder} style={{ width: "100%" }}
                    value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Damage Category *</label>
                <select className="input-dark" style={{ width: "100%" }}>
                  <option>Broken bottle</option>
                  <option>Expired</option>
                  <option>Customer spill</option>
                  <option>Delivery damage</option>
                  <option>Spoiled food</option>
                  <option>Leakage</option>
                  <option>Theft suspected</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Photo Evidence *</label>
                <div style={{ border: "2px dashed var(--border)", borderRadius: 8, padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>
                  📷 Click to upload photo — REQUIRED for approval
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, padding: "8px", background: "var(--bg-deep)", borderRadius: 6 }}>
              ⚠ This report will remain PENDING until a manager approves it. Stock will NOT be adjusted until approved.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>CANCEL</button>
              <button className="btn btn-gold" onClick={submit}>SUBMIT REPORT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── AUDIT LOGS ── */
function AuditLogs() {
  const [filter, setFilter] = useState("ALL");
  const filtered = AUDIT_LOGS.filter(l => filter === "ALL" || l.severity === filter.toLowerCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
      <SectionHeader icon="🔏" title="Immutable Audit Trail" sub="All logs are append-only. Nothing can be deleted or overwritten.">
        <button className="btn btn-outline btn-sm">⬇ Export</button>
      </SectionHeader>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["ALL", "CRITICAL", "WARNING", "INFO"].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? "btn-gold" : "btn-outline"}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
          🔒 Tamper-proof · {AUDIT_LOGS.length} total records
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th><th>Timestamp</th><th>User</th><th>Action</th>
                <th>Entity</th><th>Old Value</th><th>New Value</th><th>Reason</th><th>IP</th><th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i} className={l.severity === "critical" ? "alert-row" : ""}>
                  <td><span style={{ color: "var(--gold)", fontFamily: "monospace", fontSize: 11 }}>{l.id}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{l.ts}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {l.user !== "SYSTEM" && <Avatar initials={l.user.split(" ").map(n => n[0]).join("")} size={22} />}
                      {l.user === "SYSTEM" && <span style={{ fontSize: 16 }}>🤖</span>}
                      <span style={{ fontSize: 12, color: l.user === "SYSTEM" ? "var(--blue)" : "var(--text-primary)" }}>{l.user}</span>
                    </div>
                  </td>
                  <td><span className="tag" style={{ background: "var(--gold-glow)", color: "var(--gold)", fontSize: 10 }}>{l.action.replace(/_/g, " ")}</span></td>
                  <td style={{ fontSize: 13 }}>{l.entity}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>{l.old}</td>
                  <td style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{l.new}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 140 }}>{l.reason}</td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{l.ip}</td>
                  <td><SeverityBadge sev={l.severity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── RECONCILIATION ── */
function Reconciliation() {
  const totalLoss = RECONCILIATION.filter(r => r.variance < 0).reduce((s, r) => s + Math.abs(r.value), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
      <SectionHeader icon="⚖️" title="Stock Reconciliation Engine" sub="Daily variance analysis — Expected vs Physical count">
        <button className="btn btn-gold btn-sm">Start New Stocktake</button>
      </SectionHeader>

      <div className="grid-4">
        {[
          { label: "Products Reconciled", val: RECONCILIATION.length, color: "var(--gold)" },
          { label: "Products with Variance", val: RECONCILIATION.filter(r => r.variance !== 0).length, color: "var(--orange)" },
          { label: "Unexplained Losses", val: RECONCILIATION.filter(r => r.variance < 0).length, color: "var(--red)" },
          { label: "Total Value Lost", val: `R${totalLoss.toLocaleString()}`, color: "var(--red)" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ borderColor: s.color + "33" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{s.label}</div>
            <div className="cinzel" style={{ color: s.color, fontSize: 26, fontWeight: 700 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
          Formula: Expected = Opening + Deliveries − Sales − Approved Damage − Transfers
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th><th>Opening</th><th>Delivered</th><th>Sold</th>
                <th>Damaged</th><th>Expected</th><th>Physical Count</th>
                <th>Variance</th><th>Value</th><th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {RECONCILIATION.map((r, i) => (
                <tr key={i} className={r.risk === "high" ? "alert-row" : ""}>
                  <td style={{ fontWeight: 600 }}>{r.product}</td>
                  <td style={{ color: "var(--text-muted)" }}>{r.opening}</td>
                  <td style={{ color: "var(--blue)" }}>+{r.delivered}</td>
                  <td style={{ color: "var(--text-secondary)" }}>-{r.sold}</td>
                  <td style={{ color: "var(--orange)" }}>-{r.damaged}</td>
                  <td style={{ fontWeight: 700 }}>{r.expected}</td>
                  <td style={{ fontWeight: 700, color: r.physical < r.expected ? "var(--red)" : r.physical > r.expected ? "var(--green)" : "var(--text-primary)" }}>
                    {r.physical}
                  </td>
                  <td style={{ fontWeight: 700, color: r.variance < 0 ? "var(--red)" : r.variance > 0 ? "var(--green)" : "var(--text-muted)", fontSize: 15 }}>
                    {r.variance > 0 ? "+" : ""}{r.variance}
                  </td>
                  <td style={{ color: r.value < 0 ? "var(--red)" : r.value > 0 ? "var(--green)" : "var(--text-muted)", fontWeight: 700 }}>
                    {r.value >= 0 ? "+" : ""}R{Math.abs(r.value)}
                  </td>
                  <td>
                    <span className={`badge ${r.risk === "high" ? "badge-red" : "badge-green"}`}>
                      {r.risk === "high" ? "⚠ HIGH RISK" : "✓ LOW RISK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {RECONCILIATION.filter(r => r.risk === "high").length > 0 && (
        <div className="card" style={{ borderColor: "rgba(224,62,62,0.4)", background: "rgba(224,62,62,0.05)" }}>
          <div style={{ fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>🚨 Unexplained Loss Alert</div>
          {RECONCILIATION.filter(r => r.risk === "high").map((r, i) => (
            <div key={i} style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
              ▸ <strong style={{ color: "var(--text-primary)" }}>{r.product}</strong> — missing {Math.abs(r.variance)} units
              (R{Math.abs(r.value)} loss) · No matching sales, damage or transfers found.
              <strong style={{ color: "var(--red)" }}> Possible theft.</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── THEFT DETECTION ── */
function TheftDetection() {
  const criticalEmp = EMPLOYEES.find(e => e.id === "E001");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
      <SectionHeader icon="🧠" title="Theft Detection AI" sub="Automated pattern analysis & risk scoring">
        <button className="btn btn-red btn-sm blink">● LIVE MONITORING</button>
      </SectionHeader>

      {/* Alert cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {THEFT_ALERTS.map((a, i) => (
          <div key={i} className="card" style={{
            borderColor: a.severity === "critical" ? "rgba(224,62,62,0.5)" : a.severity === "high" ? "rgba(230,126,34,0.4)" : "var(--border)",
            background: a.severity === "critical" ? "rgba(224,62,62,0.04)" : a.severity === "high" ? "rgba(230,126,34,0.04)" : "var(--bg-card)"
          }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24 }}>
                {a.severity === "critical" ? "🚨" : a.severity === "high" ? "⚠️" : "🔔"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 14 }}>{a.emp}</span>
                  <span className="tag" style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)" }}>{a.type.replace(/_/g, " ")}</span>
                  <SeverityBadge sev={a.severity} />
                  <StatusBadge status={a.status} />
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>{a.description}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.ts} · Product: {a.product} · Alert #{a.id}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-outline btn-sm">INVESTIGATE</button>
                {a.status === "OPEN" && <button className="btn btn-red btn-sm">LOCK</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deep analysis for highest risk */}
      <div className="grid-2">
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            🎯 Risk Radar — John Mokoena (84%)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(201,168,76,0.15)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <Radar name="Risk" dataKey="A" stroke="var(--red)" fill="var(--red)" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
            📊 Suspicious Activity Timeline
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={THEFT_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.07)" />
              <XAxis dataKey="day" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--bg-card2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
              <Bar dataKey="alerts" name="Alerts" fill="var(--red)" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="voids" name="Voids" fill="var(--orange)" opacity={0.8} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Risk Table */}
      <div className="card">
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Employee Risk Analysis</div>
        <table className="data-table">
          <thead>
            <tr><th>Employee</th><th>Role</th><th>Shift</th><th>Voids</th><th>Damage Reports</th><th>Manual Edits</th><th>Shortages</th><th>Risk Score</th></tr>
          </thead>
          <tbody>
            {RISK_DATA.map((e, i) => {
              const emp = EMPLOYEES[i];
              return (
                <tr key={i}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar initials={emp.avatar} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gold">{emp.role}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{emp.shift}</td>
                  <td style={{ color: e.voids > 3 ? "var(--red)" : "var(--text-secondary)", fontWeight: e.voids > 3 ? 700 : 400 }}>{e.voids}</td>
                  <td style={{ color: e.damage > 3 ? "var(--red)" : "var(--text-secondary)", fontWeight: e.damage > 3 ? 700 : 400 }}>{e.damage}</td>
                  <td style={{ color: e.edits > 2 ? "var(--red)" : "var(--text-secondary)", fontWeight: e.edits > 2 ? 700 : 400 }}>{e.edits}</td>
                  <td style={{ color: e.shortages > 2 ? "var(--red)" : "var(--text-secondary)" }}>{e.shortages}</td>
                  <td><RiskScore score={e.score} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── REFUND SECURITY ── */
function RefundSecurity({ onToast }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
      <SectionHeader icon="💳" title="Refund & Void Security" sub="All refunds require manager PIN. Every void is tracked.">
        <div style={{ display: "flex", gap: 8 }}>
          <span className="badge badge-red">3 Flagged</span>
          <button className="btn btn-outline btn-sm">⬇ Export</button>
        </div>
      </SectionHeader>

      <div className="grid-4">
        {[
          { label: "Total Refunds Today", val: `R${REFUND_LOGS.reduce((s, r) => s + r.value, 0)}`, color: "var(--orange)" },
          { label: "Flagged Refunds", val: REFUND_LOGS.filter(r => r.status === "FLAGGED" || r.status === "SUSPICIOUS").length, color: "var(--red)" },
          { label: "Awaiting Approval", val: REFUND_LOGS.filter(r => r.approvedBy === "PENDING").length, color: "var(--gold)" },
          { label: "Approved Refunds", val: REFUND_LOGS.filter(r => r.status === "APPROVED").length, color: "var(--green)" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ borderColor: s.color + "33" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{s.label}</div>
            <div className="cinzel" style={{ color: s.color, fontSize: 26, fontWeight: 700 }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Refund ID</th><th>Timestamp</th><th>Employee</th><th>Product</th>
                <th>Qty</th><th>Value</th><th>Reason</th><th>Approved By</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {REFUND_LOGS.map((r, i) => (
                <tr key={i} className={r.status !== "APPROVED" ? "alert-row" : ""}>
                  <td><span style={{ color: "var(--gold)", fontSize: 12 }}>{r.id}</span></td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.ts}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Avatar initials={r.emp.split(" ").map(n => n[0]).join("")} size={24} />
                      <span style={{ fontSize: 12 }}>{r.emp}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{r.product}</td>
                  <td style={{ fontWeight: 700 }}>{r.qty}</td>
                  <td style={{ color: "var(--orange)", fontWeight: 700 }}>R{r.value}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.reason}</td>
                  <td style={{ fontSize: 12, color: r.approvedBy === "PENDING" ? "var(--red)" : "var(--green)" }}>
                    {r.approvedBy === "PENDING" ? "⏳ Pending" : `✅ ${r.approvedBy}`}
                  </td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    {r.approvedBy === "PENDING" && (
                      <button className="btn btn-gold btn-sm" onClick={() => onToast("✅ Refund approved — manager PIN verified", "gold")}>
                        APPROVE
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(224,62,62,0.4)", background: "rgba(224,62,62,0.04)" }}>
        <div style={{ fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>⚠ Refund Abuse Detected</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          John Mokoena submitted a R380 refund on Jameson Whiskey at 20:15 without manager approval.
          This is the 3rd high-value refund this week from this employee.
          <strong style={{ color: "var(--red)" }}> Refund locked pending investigation.</strong>
        </div>
      </div>
    </div>
  );
}

/* ── INVESTIGATIONS ── */
function Investigations({ onToast }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
      <SectionHeader icon="🔍" title="Investigations" sub="Mandatory for losses exceeding R500 threshold">
        <button className="btn btn-red btn-sm" onClick={() => setShowModal(true)}>+ Open Investigation</button>
      </SectionHeader>

      {/* Active Investigation */}
      <div className="investigation-banner">
        <span style={{ fontSize: 36 }}>🔒</span>
        <div style={{ flex: 1 }}>
          <div className="cinzel" style={{ color: "var(--red)", fontSize: 16, fontWeight: 700 }}>INV-0007 — ACTIVE INVESTIGATION</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Suspected theft by <strong style={{ color: "var(--text-primary)" }}>John Mokoena</strong> ·
            R1,312 unexplained loss · Night shift · All adjustments LOCKED
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <span className="badge badge-red">🔒 SYSTEM LOCKED</span>
            <span className="badge badge-orange">📁 Evidence: 2 files</span>
            <span className="badge badge-gold">👤 Reported by: Linda Botha</span>
            <span className="badge badge-blue">📅 Opened: 2025-05-15 22:00</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn btn-gold btn-sm">VIEW DETAILS</button>
          <button className="btn btn-outline btn-sm">ADD EVIDENCE</button>
        </div>
      </div>

      {/* Investigation steps */}
      <div className="card">
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>INV-0007 Investigation Progress</div>
        {[
          { step: "Incident Detected", done: true, ts: "2025-05-15 22:00", detail: "Automated threshold breach — R1,312 loss detected" },
          { step: "Manager Notified", done: true, ts: "2025-05-15 22:01", detail: "Linda Botha confirmed via push notification" },
          { step: "System Locked", done: true, ts: "2025-05-15 22:01", detail: "All stock adjustments frozen for affected products" },
          { step: "Evidence Collection", done: true, ts: "2025-05-16 09:00", detail: "CCTV footage + movement logs exported" },
          { step: "Owner Review", done: false, ts: "PENDING", detail: "Awaiting owner review and sign-off" },
          { step: "Resolution", done: false, ts: "PENDING", detail: "Disciplinary action or dismissal recommendation" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "1px solid rgba(201,168,76,0.06)" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: s.done ? "var(--green)" : "var(--bg-hover)",
              border: `2px solid ${s.done ? "var(--green)" : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: s.done ? "#fff" : "var(--text-muted)"
            }}>
              {s.done ? "✓" : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: s.done ? "var(--text-primary)" : "var(--text-muted)" }}>{s.step}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{s.detail}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{s.ts}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="cinzel" style={{ fontSize: 18, color: "var(--red)", marginBottom: 20 }}>🔍 Open Investigation Report</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Incident Summary", type: "textarea" },
                { label: "Affected Products", type: "text" },
                { label: "Suspected Staff Member", type: "text" },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{f.label} *</label>
                  {f.type === "textarea"
                    ? <textarea className="input-dark" rows={3} style={{ width: "100%", resize: "vertical" }} />
                    : <input className="input-dark" style={{ width: "100%" }} />}
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Evidence Upload *</label>
                <div style={{ border: "2px dashed var(--red)", borderRadius: 8, padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  📎 Upload CCTV footage, photos, documents
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, padding: "10px", background: "rgba(224,62,62,0.08)", borderRadius: 6, marginTop: 12, color: "var(--text-secondary)" }}>
              🔒 Opening an investigation will LOCK all related stock adjustments and notify the owner immediately.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>CANCEL</button>
              <button className="btn btn-red" onClick={() => { setShowModal(false); onToast("🔒 Investigation opened — system locked, owner notified", "red"); }}>
                OPEN INVESTIGATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard", label: "Live Dashboard", icon: "⚡" },
  { id: "ledger", label: "Stock Ledger", icon: "📒" },
  { id: "damage", label: "Damage Reports", icon: "⚠️" },
  { id: "audit", label: "Audit Trail", icon: "🔏" },
  { id: "reconcile", label: "Reconciliation", icon: "⚖️" },
  { id: "theft", label: "Theft Detection", icon: "🧠" },
  { id: "refunds", label: "Refund Security", icon: "💳" },
  { id: "investigations", label: "Investigations", icon: "🔍" },
];

let toastId = 0;

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "gold") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onToast={addToast} onAlert={addToast} />;
      case "ledger": return <StockLedger />;
      case "damage": return <DamageReports onToast={addToast} />;
      case "audit": return <AuditLogs />;
      case "reconcile": return <Reconciliation />;
      case "theft": return <TheftDetection />;
      case "refunds": return <RefundSecurity onToast={addToast} />;
      case "investigations": return <Investigations onToast={addToast} />;
      default: return null;
    }
  };

  const alertCount = THEFT_ALERTS.filter(a => a.status === "OPEN").length;

  return (
    <>
      <style>{style}</style>
      <div className="scanline-overlay" />

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.msg}</span>
            <span style={{ marginLeft: "auto", cursor: "pointer", color: "var(--text-muted)", fontSize: 16 }}
              onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}>×</span>
          </div>
        ))}
      </div>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-content">
          🚨 ALERT: John Mokoena — 84% theft risk · Manual edit detected 23:31 &nbsp;&nbsp;&nbsp;
          ⚠️ DR-0041 pending approval · Absolut Vodka R290 &nbsp;&nbsp;&nbsp;
          📉 Heineken variance: -6 units (R210 loss) &nbsp;&nbsp;&nbsp;
          🔒 Investigation INV-0007 active — system partially locked &nbsp;&nbsp;&nbsp;
          ✅ Delivery INV-2241 received by Peter Nkosi &nbsp;&nbsp;&nbsp;
          🚨 ALERT: John Mokoena — 84% theft risk · Manual edit detected 23:31 &nbsp;&nbsp;&nbsp;
          ⚠️ DR-0041 pending approval · Absolut Vodka R290 &nbsp;&nbsp;&nbsp;
          📉 Heineken variance: -6 units (R210 loss) &nbsp;&nbsp;&nbsp;
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 36px)", background: "var(--bg-void)" }}>

        {/* Sidebar */}
        <div style={{
          width: 220, flexShrink: 0, background: "var(--bg-deep)",
          borderRight: "1px solid var(--border)", padding: "20px 12px",
          display: "flex", flexDirection: "column", gap: 4,
          position: "sticky", top: 0, height: "calc(100vh - 36px)", overflow: "auto"
        }}>
          {/* Logo */}
          <div style={{ padding: "10px 6px 20px", marginBottom: 4 }}>
            <div className="cinzel" style={{ fontSize: 16, fontWeight: 900, color: "var(--gold)", letterSpacing: 2 }}>⚔ TAVERN</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Security Suite</div>
            <div style={{ height: 1, background: "linear-gradient(90deg, var(--gold-dim), transparent)", marginTop: 12 }} />
          </div>

          {NAV.map(n => (
            <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
              {n.id === "theft" && alertCount > 0 && (
                <span style={{
                  marginLeft: "auto", background: "var(--red)", color: "#fff",
                  borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700
                }}>{alertCount}</span>
              )}
              {n.id === "damage" && (
                <span style={{
                  marginLeft: "auto", background: "var(--orange)", color: "#fff",
                  borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700
                }}>{DAMAGE_REPORTS.filter(d => d.status === "PENDING").length}</span>
              )}
            </div>
          ))}

          <div style={{ marginTop: "auto", padding: "16px 6px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar initials="OW" size={32} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Owner</div>
                <div style={{ fontSize: 10, color: "var(--green)" }}>● Full Access</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "24px", overflow: "auto" }}>

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div className="cinzel" style={{ fontSize: 22, color: "var(--text-primary)", fontWeight: 700 }}>
                {NAV.find(n => n.id === page)?.icon} {NAV.find(n => n.id === page)?.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Last updated: {new Date().toLocaleTimeString()} · Shift: Night · 16 May 2025
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <button className="btn btn-outline btn-sm" onClick={() => addToast("🔔 3 active alerts", "red")}>
                  🔔 Alerts
                </button>
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: "var(--red)", color: "#fff", borderRadius: 10,
                  padding: "1px 5px", fontSize: 9, fontWeight: 700
                }} className="blink">{alertCount}</span>
              </div>
              <button className="btn btn-gold btn-sm">🔒 Lock System</button>
            </div>
          </div>

          {renderPage()}

          {/* Footer */}
          <div style={{ marginTop: 32, padding: "14px 0", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              🔏 Tavern Security Suite v2.4 · All audit logs immutable · South African Rand (ZAR)
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              © 2025 Tavern POS · Enterprise Edition
            </div>
          </div>
        </div>
      </div>
    </>
  );
}