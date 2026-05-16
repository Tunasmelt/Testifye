// mock-data.jsx — Realistic project data for the demo

const PEBBLE_SCREENS = [
  {
    id: 'home',
    label: 'Home / Discover',
    elements: 18,
    verified: true,
    thumb: 'home',
  },
  {
    id: 'search',
    label: 'Search Results',
    elements: 24,
    verified: true,
    thumb: 'search',
  },
  {
    id: 'detail',
    label: 'Stay Detail',
    elements: 32,
    verified: true,
    dirty: true,
    thumb: 'detail',
  },
  {
    id: 'checkout',
    label: 'Checkout',
    elements: 21,
    verified: true,
    thumb: 'checkout',
  },
  {
    id: 'confirmation',
    label: 'Booking Confirmation',
    elements: 14,
    verified: false,
    thumb: 'confirmation',
  },
  {
    id: 'profile',
    label: 'Profile',
    elements: 19,
    verified: true,
    thumb: 'profile',
  },
];

const TEST_CASES = [
  { id: 'TC-001', title: 'User can search for stays by destination and dates', category: 'functional', priority: 'critical', verified: true, screen: 'Home', steps: 5 },
  { id: 'TC-002', title: 'Search returns results filtered by guest count', category: 'functional', priority: 'high', verified: true, screen: 'Search', steps: 4 },
  { id: 'TC-003', title: 'Empty search query shows helpful suggestions', category: 'edge', priority: 'medium', verified: true, screen: 'Home', steps: 3 },
  { id: 'TC-004', title: 'Selecting unavailable dates disables booking CTA', category: 'negative', priority: 'high', verified: true, screen: 'Stay Detail', steps: 6 },
  { id: 'TC-005', title: 'Photo gallery is keyboard-navigable on web', category: 'accessibility', priority: 'medium', verified: true, screen: 'Stay Detail', steps: 4 },
  { id: 'TC-006', title: 'Card payment fails gracefully when 3DS times out', category: 'negative', priority: 'critical', verified: true, screen: 'Checkout', steps: 7 },
  { id: 'TC-007', title: 'Apple Pay fallback to card when wallet rejected', category: 'edge', priority: 'high', verified: true, screen: 'Checkout', steps: 5 },
  { id: 'TC-008', title: 'Booking confirmation email triggers within 30s', category: 'performance', priority: 'high', verified: true, screen: 'Confirmation', steps: 3 },
  { id: 'TC-009', title: 'User can cancel booking within free-cancellation window', category: 'functional', priority: 'high', verified: false, screen: 'Profile', steps: 6, note: 'Element "Cancel Booking" not found in analyzed screens' },
  { id: 'TC-010', title: 'Form validation prevents invalid email submission', category: 'functional', priority: 'medium', verified: true, screen: 'Checkout', steps: 4 },
  { id: 'TC-011', title: 'Loading state shows for searches longer than 2s', category: 'performance', priority: 'medium', verified: true, screen: 'Search', steps: 3 },
  { id: 'TC-012', title: 'Network drop during checkout preserves cart state', category: 'edge', priority: 'critical', verified: true, screen: 'Checkout', steps: 8 },
];

const UX_HEURISTICS = [
  { id: 1, name: 'Visibility of system status',     score: 8.2 },
  { id: 2, name: 'Match with real world',           score: 9.0 },
  { id: 3, name: 'User control & freedom',          score: 7.4 },
  { id: 4, name: 'Consistency & standards',         score: 8.8 },
  { id: 5, name: 'Error prevention',                score: 6.1 },
  { id: 6, name: 'Recognition over recall',         score: 8.5 },
  { id: 7, name: 'Flexibility & efficiency',        score: 7.0 },
  { id: 8, name: 'Aesthetic & minimalist design',   score: 9.2 },
  { id: 9, name: 'Error recovery',                  score: 5.8 },
  { id:10, name: 'Help & documentation',            score: 6.5 },
];

const UX_ISSUES = [
  { id: 'UX-001', severity: 'critical', heuristic: 5, screen: 'Checkout', description: 'No confirmation dialog before deleting saved payment method', suggestion: 'Add an "Are you sure?" modal with destructive action styling', effort: 'quick-win' },
  { id: 'UX-002', severity: 'major', heuristic: 9, screen: 'Search Results', description: 'Network errors show generic "Something went wrong" with no retry CTA', suggestion: 'Provide specific error context + Retry button + offline mode hint', effort: 'moderate' },
  { id: 'UX-003', severity: 'major', heuristic: 1, screen: 'Stay Detail', description: 'Booking calculation lacks loading indicator (~2.3s wait)', suggestion: 'Add skeleton or spinner while pricing recalculates', effort: 'quick-win' },
  { id: 'UX-004', severity: 'minor', heuristic: 4, screen: 'Profile', description: 'Logout button uses different styling than other destructive actions', suggestion: 'Apply consistent destructive-action token across the app', effort: 'quick-win' },
  { id: 'UX-005', severity: 'major', heuristic: 10, screen: 'Checkout', description: 'No tooltip explaining what 3D Secure verification means', suggestion: 'Add inline help with link to bank guidance', effort: 'moderate' },
];

const A11Y_FLAGS = [
  { type: 'contrast',     screen: 'Stay Detail', element: 'Price text on hero image', detail: 'Contrast ratio 2.4:1 (WCAG AA requires 4.5:1)', criterion: '1.4.3' },
  { type: 'touch_target', screen: 'Search',      element: 'Filter chip close (×) button', detail: '24×24px (Apple HIG: 44×44px minimum)', criterion: '2.5.5' },
  { type: 'alt_text',     screen: 'Home',        element: 'Hero carousel images', detail: 'No descriptive alt text on 4 of 6 images', criterion: '1.1.1' },
];

const PRD_FINDINGS = [
  { id: 'GAP-01', type: 'contradiction', severity: 'critical', location: '§2.4 vs §4.1', description: 'Cancellation policy: §2.4 says "free up to 24h before", §4.1 says "48h"', suggestion: 'Resolve to single cancellation window' },
  { id: 'GAP-02', type: 'missing_flow', severity: 'high', location: '§3 (Checkout)', description: 'No flow defined for split-payment between two cards', suggestion: 'Either define flow, or explicitly mark as out-of-scope for v1' },
  { id: 'GAP-03', type: 'ambiguity', severity: 'medium', location: '§5.2', description: '"Notifications should be smart" — undefined behavior', suggestion: 'Specify trigger conditions, frequency cap, channels (push/email/SMS)' },
  { id: 'GAP-04', type: 'untestable', severity: 'medium', location: '§1.3', description: '"App must feel premium" — not measurable', suggestion: 'Replace with: <2s TTI, <100ms touch response, 60fps scroll' },
  { id: 'GAP-05', type: 'undefined_error_state', severity: 'high', location: '§3.5', description: 'No spec for booking when stay becomes unavailable mid-checkout', suggestion: 'Define recovery: refund, alternative suggestions, retry policy' },
];

const PERSONAS = [
  { id: 'first-time', name: 'First-time user', empathy: 'Cautious, scans for trust signals, hesitates at form fields' },
  { id: 'power',      name: 'Power user',      empathy: 'Fast scanner, expects keyboard shortcuts, bulk actions' },
  { id: 'elderly',    name: 'Elderly (65+)',   empathy: 'Larger touch targets, reads carefully, anxious about errors' },
  { id: 'low-vision', name: 'Low vision',      empathy: 'Relies on contrast, screen reader, predictable flow' },
];

const SEMANTIC_LINKS = [
  { req: 'Users can sign in with Google', loc: '§2.1', element: 'Continue with Google', screen: 'Home', status: 'verified', confidence: 0.96 },
  { req: 'Apple Pay supported at checkout', loc: '§3.2', element: 'Apple Pay button', screen: 'Checkout', status: 'verified', confidence: 0.92 },
  { req: 'Multi-currency display (EUR, GBP, USD)', loc: '§1.4', element: null, screen: null, status: 'missing', confidence: 0.0, note: 'Currency selector not found in any screen' },
  { req: 'Wishlist with shareable links', loc: '§4.5', element: 'Heart icon on stay cards', screen: 'Search', status: 'mismatch', confidence: 0.65, note: 'Heart icon present but no share affordance found' },
  { req: 'Backend: refund processing within 5 days', loc: '§6.1', element: null, screen: null, status: 'untested', confidence: 0.0, note: 'Backend concern — no UI evidence possible' },
];

const I18N_FINDINGS = [
  { category: 'text_expansion', severity: 'major', screen: 'Checkout', element: '"Pay" button',            detail: 'German "Bezahlen" 65% longer — will overflow at 320px', locales: ['de-DE', 'fi-FI'] },
  { category: 'rtl',            severity: 'critical', screen: 'Stay Detail', element: 'Image gallery arrows', detail: 'Hard-coded "next/prev" direction breaks in Arabic', locales: ['ar-SA', 'he-IL'] },
  { category: 'date_format',    severity: 'minor', screen: 'Search', element: 'Date picker',                detail: 'MM/DD/YYYY hardcoded; rest of EU expects DD/MM/YYYY', locales: ['en-GB', 'fr-FR', 'de-DE'] },
  { category: 'currency',       severity: 'minor', screen: 'Search', element: 'Price label',                detail: 'Symbol always pre-fixed; many locales post-fix', locales: ['fr-FR', 'de-DE'] },
];

const CHAT_PRESETS = [
  'What if the database times out during payment?',
  'Is TC-006 still relevant after the latest UX review?',
  'Give me 5 exploratory test ideas for onboarding',
  'Summarize the gaps in my test coverage',
];

window.MockData = {
  PEBBLE_SCREENS, TEST_CASES, UX_HEURISTICS, UX_ISSUES, A11Y_FLAGS,
  PRD_FINDINGS, PERSONAS, SEMANTIC_LINKS, I18N_FINDINGS, CHAT_PRESETS,
};
