// shell.jsx — Sidebar, topbar, navigation

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',         icon: 'home' },
  { id: 'test-gen',  label: 'Test Cases',       icon: 'testCases', badge: '24' },
  { id: 'ux',        label: 'UX Audit',         icon: 'ux',        badge: 'B+' },
  { id: 'bugs',      label: 'Bug Reports',      icon: 'bug' },
  { id: 'gaps',      label: 'Gap Finder',       icon: 'gap' },
  { id: 'link',      label: 'Semantic Link',    icon: 'link' },
  { id: 'data',      label: 'Test Data',        icon: 'data' },
  { id: 'persona',   label: 'Persona Friction', icon: 'persona' },
  { id: 'i18n',      label: 'i18n Audit',       icon: 'globe' },
  { id: 'export',    label: 'Export',           icon: 'export' },
];

function Sidebar({ activeTab, onTabChange }) {
  const I = window.Icons;
  return (
    <aside className="tf-sidebar">
      <div className="tf-logo">
        <div className="tf-logo-mark"><I.logo size={28} /></div>
        <div className="tf-logo-text">Tesi<span>fye</span></div>
        <div style={{marginLeft:'auto', fontSize:9, color:'var(--text-2)', fontFamily:'JetBrains Mono, monospace'}}>v1.2</div>
      </div>

      <button className="tf-project-switcher">
        <div className="tf-proj-icon">PT</div>
        <div className="tf-proj-meta">
          <div className="tf-proj-name">Pebble Travel</div>
          <div className="tf-proj-sub">Mobile · iOS + Android</div>
        </div>
        <I.chevronDown size={14} />
      </button>

      <div className="tf-nav-section">Workspace</div>
      <nav className="tf-nav">
        {NAV_ITEMS.map(item => {
          const IconC = I[item.icon];
          return (
            <button
              key={item.id}
              className={`tf-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <IconC size={15} />
              <span>{item.label}</span>
              {item.badge && <span className="tf-nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="tf-nav-section" style={{borderTop:'1px solid var(--border)', paddingTop:14}}>Tools</div>
      <nav className="tf-nav" style={{flex:'none'}}>
        <button className="tf-nav-item">
          <I.chat size={15} /><span>Sidekick Chat</span>
          <span className="tf-nav-badge" style={{background:'rgba(52,211,153,0.12)', color:'var(--success)'}}>●</span>
        </button>
        <button className="tf-nav-item">
          <I.settings size={15} /><span>Settings</span>
        </button>
      </nav>

      <div className="tf-sidebar-footer">
        <div className="tf-avatar">SM</div>
        <div className="tf-user-meta">
          <div className="tf-user-name">Sam Mendez</div>
          <div className="tf-user-plan">Free · GROQ</div>
        </div>
        <button className="tf-btn tf-btn-icon tf-btn-ghost" title="Account"><I.more size={14} /></button>
      </div>
    </aside>
  );
}

function Topbar({ activeTab }) {
  const I = window.Icons;
  const labelMap = Object.fromEntries(NAV_ITEMS.map(n => [n.id, n.label]));
  return (
    <div className="tf-topbar">
      <div className="tf-breadcrumb">
        <I.folder size={14} />
        <span>Pebble Travel</span>
        <span className="tf-breadcrumb-sep">/</span>
        <b>{labelMap[activeTab] || 'Overview'}</b>
      </div>
      <div className="tf-search">
        <I.search size={13} />
        <span style={{flex:1}}>Quick search…</span>
        <span className="tf-kbd">⌘K</span>
      </div>
      <span className="tf-provider-badge">
        <span className="tf-dot"></span>
        GROQ · llama-4-scout
      </span>
      <button className="tf-btn tf-btn-icon tf-btn-ghost" title="Notifications">
        <I.refresh size={14} />
      </button>
    </div>
  );
}

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.NAV_ITEMS = NAV_ITEMS;
