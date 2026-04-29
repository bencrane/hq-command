'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { BrandPack, ChatMessage, LayoutConfig, MailerDesign } from './types';
import { DEFAULT_BRAND } from './types';
import { DEFAULT_SPEC_VARIANT, getSpec } from './specs';

interface Snapshot {
  specVariant: string;
  brand: BrandPack;
  config: LayoutConfig;
}

interface DesignerState {
  designId: string | null;
  designName: string;
  versionNumber: number;
  specVariant: string;
  brand: BrandPack;
  config: LayoutConfig;
  selectedElementId: string | null;
  /** Canvas viewport state. */
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  showSafeZone: boolean;
  showBleed: boolean;
  /** Chat history for the active design. */
  messages: ChatMessage[];
  agentBusy: boolean;
  /** Undo/redo stacks of full snapshots. */
  past: Snapshot[];
  future: Snapshot[];
  /** Has the user touched the canvas in any way? */
  hasContent: boolean;
  /** Save state. */
  saving: boolean;
  lastSavedAt: number | null;
  dirty: boolean;
}

interface DesignerActions {
  setSpec: (variant: string) => void;
  setBrand: (brand: BrandPack) => void;
  setConfig: (patch: Partial<LayoutConfig>) => void;
  applyAgentPatch: (patch: Partial<LayoutConfig>) => void;
  setOverride: (
    elementId: string,
    override: Partial<NonNullable<LayoutConfig['overrides']>[string]>,
  ) => void;
  clearOverride: (elementId: string) => void;
  selectElement: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggle: (key: 'showGrid' | 'showSafeZone' | 'showBleed') => void;
  pushMessage: (msg: ChatMessage) => void;
  setAgentBusy: (busy: boolean) => void;
  undo: () => void;
  redo: () => void;
  loadDesign: (design: MailerDesign, messages?: ChatMessage[]) => void;
  startSave: () => void;
  finishSave: (id: string, version: number) => void;
  setDesignName: (name: string) => void;
  reset: () => void;
}

const STARTER_CONFIG: LayoutConfig = {
  layoutId: 'hero-headline',
  side: 'back',
  headline: 'A new era for your route planning',
  subhead: 'Built for carriers who move freight, not paperwork.',
  body: '',
  cta: 'Talk to a specialist',
  phone: '(555) 010-2024',
  proofPoints: [],
  overrides: {},
};

const INITIAL_STATE: Omit<DesignerState, never> = {
  designId: null,
  designName: 'Untitled mailer',
  versionNumber: 1,
  specVariant: DEFAULT_SPEC_VARIANT,
  brand: DEFAULT_BRAND,
  config: STARTER_CONFIG,
  selectedElementId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: false,
  showSafeZone: true,
  showBleed: true,
  messages: [],
  agentBusy: false,
  past: [],
  future: [],
  hasContent: false,
  saving: false,
  lastSavedAt: null,
  dirty: false,
};

const MAX_HISTORY = 50;

function takeSnapshot(s: DesignerState): Snapshot {
  return {
    specVariant: s.specVariant,
    brand: s.brand,
    config: s.config,
  };
}

function pushHistory(s: DesignerState, snapshot: Snapshot): Pick<DesignerState, 'past' | 'future'> {
  const past = [...s.past, snapshot].slice(-MAX_HISTORY);
  return { past, future: [] };
}

export const useDesignerStore = create<DesignerState & DesignerActions>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    setSpec: (variant) => {
      // Validate the variant exists.
      getSpec(variant);
      set((s) => ({
        ...pushHistory(s, takeSnapshot(s)),
        specVariant: variant,
        hasContent: true,
        dirty: true,
      }));
    },

    setBrand: (brand) =>
      set((s) => ({
        ...pushHistory(s, takeSnapshot(s)),
        brand,
        hasContent: true,
        dirty: true,
      })),

    setConfig: (patch) =>
      set((s) => ({
        ...pushHistory(s, takeSnapshot(s)),
        config: { ...s.config, ...patch },
        hasContent: true,
        dirty: true,
      })),

    applyAgentPatch: (patch) =>
      set((s) => {
        // Preserve user overrides on text/positions; agent patches lower-priority text.
        const nextConfig: LayoutConfig = {
          ...s.config,
          ...patch,
          overrides: { ...s.config.overrides, ...(patch.overrides ?? {}) },
        };
        return {
          ...pushHistory(s, takeSnapshot(s)),
          config: nextConfig,
          hasContent: true,
          dirty: true,
        };
      }),

    setOverride: (elementId, override) =>
      set((s) => {
        const prev = s.config.overrides[elementId] ?? {};
        const next = { ...prev, ...override };
        return {
          ...pushHistory(s, takeSnapshot(s)),
          config: {
            ...s.config,
            overrides: { ...s.config.overrides, [elementId]: next },
          },
          hasContent: true,
          dirty: true,
        };
      }),

    clearOverride: (elementId) =>
      set((s) => {
        const next = { ...s.config.overrides };
        delete next[elementId];
        return {
          ...pushHistory(s, takeSnapshot(s)),
          config: { ...s.config, overrides: next },
          dirty: true,
        };
      }),

    selectElement: (id) => set({ selectedElementId: id }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (pan) => set({ pan }),
    toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<DesignerState>),

    pushMessage: (msg) =>
      set((s) => ({
        messages: [...s.messages, msg],
        hasContent: s.hasContent || msg.role !== 'system',
      })),

    setAgentBusy: (busy) => set({ agentBusy: busy }),

    undo: () => {
      const s = get();
      if (s.past.length === 0) return;
      const prev = s.past[s.past.length - 1];
      set({
        past: s.past.slice(0, -1),
        future: [takeSnapshot(s), ...s.future],
        specVariant: prev.specVariant,
        brand: prev.brand,
        config: prev.config,
        dirty: true,
      });
    },

    redo: () => {
      const s = get();
      if (s.future.length === 0) return;
      const next = s.future[0];
      set({
        past: [...s.past, takeSnapshot(s)],
        future: s.future.slice(1),
        specVariant: next.specVariant,
        brand: next.brand,
        config: next.config,
        dirty: true,
      });
    },

    loadDesign: (design, messages = []) =>
      set({
        designId: design.id,
        designName: design.name,
        versionNumber: design.versionNumber,
        specVariant: design.specVariant,
        brand: design.brand,
        config: design.config,
        messages,
        past: [],
        future: [],
        hasContent: true,
        dirty: false,
        lastSavedAt: Date.parse(design.updatedAt),
      }),

    startSave: () => set({ saving: true }),
    finishSave: (id, version) =>
      set({
        saving: false,
        designId: id,
        versionNumber: version,
        lastSavedAt: Date.now(),
        dirty: false,
      }),

    setDesignName: (name) => set({ designName: name, dirty: true }),

    reset: () => set({ ...INITIAL_STATE }),
  })),
);
