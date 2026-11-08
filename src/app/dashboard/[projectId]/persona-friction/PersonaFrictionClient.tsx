'use client';

/**
 * Persona Friction Analysis — Phase 4 Task 4.1
 * Analyzes UX from the perspective of specific user personas.
 */

import { useState, useCallback } from 'react';
import { useStreamPersonaFriction } from '@/lib/hooks/useStreamPersonaFriction';
import type { PersonaOutput, FrictionItem } from '@/lib/schemas/persona-friction';
import type { DeepPartial } from 'ai';
import * as I from '@/components/ui/Icons';

// ── Persona config ─────────────────────────────────────────────────────────────

const PERSONAS = [
  {
    id:          'gen_z',
    label:       'Gen Z',
    sub:         'Mobile-first, impatient',
    emoji:       '📱',
    color:       '#a78bfa',
  },
  {
    id:          'tech_averse',
    label:       'Tech-Averse',
    sub:         'Needs guidance',
    emoji:       '🧭',
    color:       '#60a5fa',
  },
  {
    id:          'power_user',
    label:       'Power User',
    sub:         'Efficiency-focused',
    emoji:       '⚡',
    color:       '#fbbf24',
  },
  {
    id:          'first_time_user',
    label:       'First-Timer',
    sub:         'Zero prior context',
    emoji:       '🌱',
    color:       '#34d399',
  },
  {
    id:          'accessibility',
    label:       'Accessibility',
    sub:         'Assistive technology',
    emoji:       '♿',
    color:       '#f87171',
  },
] as const;

// Hex colors for CSS alpha appending
const SEVERITY_HEX: Record<string, string> = {
  blocking:    '#ff4444',
  frustrating: '#f87171',
  annoying:    '#fbbf24',
  minor:       '#94a3b8',
};

const FRICTION_TYPE_LABELS: Record<string, string> = {
  cognitive_load:      'Cognitive Load',
  trust_issue:         'Trust Issue',
  missing_affordance:  'Missing Affordance',
  accessibility:       'Accessibility',
  confusion:           'Confusion',
  visual_hierarchy:    'Visual Hierarchy',
};

const RISK_COLOR: Record<string, string> = {
  high:   '#f87171',
  medium: '#fbbf24',
  low:    '#34d399',
};

interface Props { projectId: string }

function FrictionItemRow({ item }: { item: FrictionItem }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span
        className="tf-badge"
        style={{
          background: SEVERITY_HEX[item.severity] + '22',
          color:       SEVERITY_HEX[item.severity],
          borderColor: SEVERITY_HEX[item.severity] + '44',
          flexShrink: 0,
          fontSize: 10,
          whiteSpace: 'nowrap',
        }}
      >
        {item.severity.toUpperCase()}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{item.description}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.screen}</span>
          {item.element && <> · <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.element}</span></>}
          {' · '}
          <span>{FRICTION_TYPE_LABELS[item.friction_type] ?? item.friction_type}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--accent-2)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <I.Sparkle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ lineHeight: 1.5 }}>{item.suggestion}</span>
        </div>
      </div>
    </div>
  );
}

function PersonaCard({
  persona,
  data,
  isStreaming,
}: {
  persona: typeof PERSONAS[number];
  data?: PersonaOutput | DeepPartial<PersonaOutput>;
  isStreaming: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const uxScore      = typeof data?.ux_score === 'number' ? data.ux_score : null;
  const dropOffRisk  = data?.drop_off_risk;
  const empathy      = data?.empathy_statement;
  const frictionItems = (data?.friction_items ?? []) as FrictionItem[];

  if (isStreaming && !data) {
    return (
      <div className="tf-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>{persona.emoji}</span>
          <div>
            <div className="tf-skeleton" style={{ width: 120, height: 14, borderRadius: 4, marginBottom: 6 }} />
            <div className="tf-skeleton" style={{ width: 80, height: 11, borderRadius: 4 }} />
          </div>
          <div className="tf-skeleton" style={{ marginLeft: 'auto', width: 48, height: 28, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="tf-card tf-fade-in" style={{ padding: 0, overflow: 'hidden', borderColor: data ? persona.color + '40' : undefined }}>
      {/* Card header */}
      <div
        style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: expanded ? '1px solid var(--border)' : 'none' }}
        onClick={() => setExpanded((e) => !e)}
      >
        <span style={{ fontSize: 22 }}>{persona.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: persona.color }}>{persona.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>{persona.sub}</div>
        </div>

        {uxScore !== null && (
          <div style={{ textAlign: 'center', marginRight: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: uxScore >= 70 ? 'var(--success)' : uxScore >= 50 ? 'var(--warning)' : 'var(--error)' }}>
              {uxScore}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>score</div>
          </div>
        )}

        {dropOffRisk && (
          <span
            className="tf-badge"
            style={{ background: RISK_COLOR[dropOffRisk] + '22', color: RISK_COLOR[dropOffRisk], borderColor: RISK_COLOR[dropOffRisk] + '44', fontSize: 11 }}
          >
            {dropOffRisk.toUpperCase()} RISK
          </span>
        )}

        <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 4 }}>
          {frictionItems.length > 0 ? `${frictionItems.length} issues` : ''}
        </span>

        <I.ChevronDown
          size={14}
          style={{ color: 'var(--text-2)', flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </div>

      {expanded && (
        <>
          {empathy && (
            <div style={{ padding: '10px 14px', background: persona.color + '12', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Their perspective
              </div>
              <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-1)', lineHeight: 1.6 }}>
                "{empathy}"
              </div>
            </div>
          )}

          {frictionItems.length > 0 ? (
            frictionItems.map((item, i) => (
              <FrictionItemRow key={i} item={item} />
            ))
          ) : data ? (
            <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--success)', fontSize: 13 }}>
              <I.CheckCircle size={18} style={{ marginBottom: 6 }} />
              <div>No friction detected for this persona.</div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function PersonaFrictionClient({ projectId }: Props) {
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['gen_z', 'tech_averse']);
  const { status, result, partial, error, provider, model, run, cancel } = useStreamPersonaFriction();

  const isRunning = status === 'starting' || status === 'streaming';

  const togglePersona = useCallback((id: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter((p) => p !== id) : prev  // keep ≥1
        : [...prev, id]
    );
  }, []);

  const handleRun = useCallback(() => {
    run({ projectId, selectedPersonas });
  }, [run, projectId, selectedPersonas]);

  // Merge partial stream into persona map
  const activePersonas = result?.personas ?? (partial?.personas as PersonaOutput[] | undefined);

  return (
    <div className="tf-fade-in">
      {/* Header */}
      <div className="tf-page-header">
        <div>
          <div className="tf-page-title">
            <I.Persona size={20} style={{ color: 'var(--accent-2)' }} />
            Persona Friction Analysis
          </div>
          <div className="tf-page-sub">
            Analyze your UX through the lens of specific user personas — identify friction that affects each group differently.
          </div>
        </div>
        {(provider && model) && (
          <span className="tf-provider-badge">
            <span className="tf-dot" />
            {provider} / {model}
          </span>
        )}
      </div>

      {/* Config card */}
      <div className="tf-card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-1)' }}>
          Select personas to analyze
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {PERSONAS.map((p) => {
            const active = selectedPersonas.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => togglePersona(p.id)}
                className="tf-btn"
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderColor: active ? p.color : 'var(--border)',
                  background:  active ? p.color + '18' : 'transparent',
                  color:       active ? p.color : 'var(--text-2)',
                  fontWeight:  active ? 600 : 400,
                  transition:  'all 0.15s',
                }}
              >
                <span style={{ fontSize: 16 }}>{p.emoji}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13 }}>{p.label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{p.sub}</div>
                </div>
                {active && <I.Check size={13} style={{ marginLeft: 2 }} />}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {isRunning && (
            <button className="tf-btn" onClick={cancel}>
              <I.X size={14} /> Cancel
            </button>
          )}
          <button
            className="tf-btn tf-btn-primary"
            disabled={isRunning || selectedPersonas.length === 0}
            onClick={handleRun}
          >
            {isRunning
              ? <><span className="tf-spin" style={{ display: 'inline-flex' }}><I.Refresh size={14} /></span> Analyzing personas…</>
              : <><I.Persona size={14} /> Analyze {selectedPersonas.length} Persona{selectedPersonas.length !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      </div>

      {/* Error */}
      {status === 'error' && error && (
        <div
          className="tf-card"
          style={{ marginBottom: 16, padding: 14, borderColor: 'var(--error)', background: 'rgba(248,113,113,0.05)', display: 'flex', gap: 10, alignItems: 'center' }}
        >
          <I.AlertCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
          <span style={{ fontSize: 13 }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {(status === 'streaming' || status === 'starting' || status === 'complete') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PERSONAS.filter((p) => selectedPersonas.includes(p.id)).map((persona) => {
            const data = activePersonas?.find((ap) => ap.persona_id === persona.id);
            return (
              <PersonaCard
                key={persona.id}
                persona={persona}
                data={data}
                isStreaming={isRunning && !data}
              />
            );
          })}
        </div>
      )}

      {/* Idle empty state */}
      {status === 'idle' && (
        <div className="tf-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-2)' }}>
          <I.Persona size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>Select personas above and run the analysis.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Each persona reveals friction unique to their needs and expectations.</p>
        </div>
      )}
    </div>
  );
}
