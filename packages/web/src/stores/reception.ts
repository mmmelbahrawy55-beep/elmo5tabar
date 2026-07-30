'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  QueueEntry,
  QueueServicePoint,
  QueueStats,
  ReceptionDashboardData,
  WalkInRegistration,
  InsuranceVerification,
  BranchTransfer,
  HomeVisitRequest,
  EmergencyCase,
  ReceptionFilters,
  KeyboardShortcut,
  PatientSearchResult,
  PrinterConfig,
} from '@/types/reception';

// ============================================================
// 1. QUEUE STORE — Real-time queue state management
// ============================================================
interface QueueState {
  entries: QueueEntry[];
  servicePoints: QueueServicePoint[];
  stats: QueueStats | null;
  selectedEntry: QueueEntry | null;
  isPolling: boolean;
  pollInterval: NodeJS.Timeout | null;
  branchId: string | null;
  filters: { status: string; priority: string; serviceType: string };

  setBranch: (branchId: string) => void;
  fetchQueue: (branchId?: string, filters?: Partial<QueueState['filters']>) => Promise<void>;
  fetchStats: (branchId?: string) => Promise<void>;
  fetchServicePoints: (branchId?: string) => Promise<void>;
  selectEntry: (entry: QueueEntry | null) => void;
  updateEntryStatus: (entryId: string, status: QueueEntry['status']) => void;
  addEntry: (entry: QueueEntry) => void;
  removeEntry: (entryId: string) => void;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  setFilters: (filters: Partial<QueueState['filters']>) => void;
  getFilteredEntries: () => QueueEntry[];
  getPosition: (entryId: string) => number;
  clearQueue: () => void;
}

const defaultQueueFilters = { status: '', priority: '', serviceType: '' };

export const useQueueStore = create<QueueState>((set, get) => ({
  entries: [],
  servicePoints: [],
  stats: null,
  selectedEntry: null,
  isPolling: false,
  pollInterval: null,
  branchId: null,
  filters: { ...defaultQueueFilters },

  setBranch: (branchId) => {
    const { stopPolling } = get();
    stopPolling();
    set({ branchId, entries: [], stats: null, servicePoints: [], selectedEntry: null });
    get().fetchQueue(branchId);
    get().fetchStats(branchId);
    get().fetchServicePoints(branchId);
  },

  fetchQueue: async (branchId, filters) => {
    const { branchId: stateBranchId, filters: stateFilters } = get();
    const bid = branchId ?? stateBranchId;
    if (!bid) return;

    const activeFilters = filters
      ? { ...stateFilters, ...filters }
      : stateFilters;

    const params = new URLSearchParams({ branchId: bid });
    if (activeFilters.status) params.set('status', activeFilters.status);
    if (activeFilters.priority) params.set('priority', activeFilters.priority);
    if (activeFilters.serviceType) params.set('serviceType', activeFilters.serviceType);

    try {
      const res = await fetch(`/api/reception/queue?${params.toString()}`);
      if (!res.ok) return;
      const data: QueueEntry[] = await res.json();
      set({ entries: data, filters: activeFilters });
    } catch {
      // silent — polling will retry
    }
  },

  fetchStats: async (branchId) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    try {
      const res = await fetch(`/api/reception/queue/stats?branchId=${bid}`);
      if (!res.ok) return;
      const data: QueueStats = await res.json();
      set({ stats: data });
    } catch {
      // silent
    }
  },

  fetchServicePoints: async (branchId) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    try {
      const res = await fetch(`/api/reception/service-points?branchId=${bid}`);
      if (!res.ok) return;
      const data: QueueServicePoint[] = await res.json();
      set({ servicePoints: data });
    } catch {
      // silent
    }
  },

  selectEntry: (entry) => set({ selectedEntry: entry }),

  updateEntryStatus: (entryId, status) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId ? { ...e, status, updatedAt: new Date().toISOString() } : e
      ),
      selectedEntry:
        state.selectedEntry?.id === entryId
          ? { ...state.selectedEntry, status, updatedAt: new Date().toISOString() }
          : state.selectedEntry,
    }));

    fetch(`/api/reception/queue/${entryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {
      // Optimistic rollback could be added here
    });
  },

  addEntry: (entry) => {
    set((state) => ({
      entries: [...state.entries, entry],
    }));
  },

  removeEntry: (entryId) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== entryId),
      selectedEntry: state.selectedEntry?.id === entryId ? null : state.selectedEntry,
    }));
  },

  startPolling: (intervalMs = 5000) => {
    const { stopPolling, pollInterval } = get();
    if (pollInterval) stopPolling();

    const id = setInterval(() => {
      const { branchId, filters } = get();
      if (branchId) {
        get().fetchQueue(branchId, filters);
        get().fetchStats(branchId);
        get().fetchServicePoints(branchId);
      }
    }, intervalMs);

    set({ pollInterval: id, isPolling: true });
  },

  stopPolling: () => {
    const { pollInterval } = get();
    if (pollInterval) clearInterval(pollInterval);
    set({ pollInterval: null, isPolling: false });
  },

  setFilters: (filters) => {
    set((state) => {
      const next = { ...state.filters, ...filters };
      return { filters: next };
    });
    const { branchId, filters: f } = get();
    if (branchId) get().fetchQueue(branchId, f);
  },

  getFilteredEntries: () => {
    const { entries, filters } = get();
    return entries.filter((e) => {
      if (filters.status && e.status !== filters.status) return false;
      if (filters.priority && e.priority !== filters.priority) return false;
      if (filters.serviceType && e.serviceType !== filters.serviceType) return false;
      return true;
    });
  },

  getPosition: (entryId) => {
    const { entries } = get();
    const waiting = entries
      .filter((e) => e.status === 'waiting')
      .sort((a, b) => {
        const prioOrder: Record<string, number> = { emergency: 0, vip: 1, priority: 2, normal: 3 };
        const diff = (prioOrder[a.priority] ?? 3) - (prioOrder[b.priority] ?? 3);
        if (diff !== 0) return diff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    return waiting.findIndex((e) => e.id === entryId) + 1;
  },

  clearQueue: () => {
    const { stopPolling } = get();
    stopPolling();
    set({
      entries: [],
      servicePoints: [],
      stats: null,
      selectedEntry: null,
      branchId: null,
      filters: { ...defaultQueueFilters },
    });
  },
}));

// ============================================================
// 2. RECEPTION STORE — Walk-in, insurance, transfer, home visit
// ============================================================
type ActivePanel = 'walk-in' | 'insurance' | 'transfers' | 'home-visits' | 'emergency' | 'search';

interface ReceptionState {
  walkIns: WalkInRegistration[];
  verifications: InsuranceVerification[];
  transfers: BranchTransfer[];
  homeVisits: HomeVisitRequest[];
  emergencies: EmergencyCase[];
  dashboardData: ReceptionDashboardData | null;
  patientSearchResults: PatientSearchResult[];
  isSearching: boolean;
  activePanel: ActivePanel;
  branchId: string | null;

  setBranch: (branchId: string) => void;
  fetchDashboardData: (branchId?: string) => Promise<void>;
  fetchWalkIns: (branchId?: string, filters?: ReceptionFilters) => Promise<void>;
  fetchVerifications: (branchId?: string, filters?: ReceptionFilters) => Promise<void>;
  fetchTransfers: (branchId?: string, type?: 'incoming' | 'outgoing') => Promise<void>;
  fetchHomeVisits: (branchId?: string, filters?: ReceptionFilters) => Promise<void>;
  fetchEmergencies: (branchId?: string) => Promise<void>;
  searchPatients: (query: string, branchId?: string) => Promise<void>;
  setActivePanel: (panel: ActivePanel) => void;
  addWalkIn: (walkIn: WalkInRegistration) => void;
  addTransfer: (transfer: BranchTransfer) => void;
  addHomeVisit: (homeVisit: HomeVisitRequest) => void;
  addEmergency: (emergency: EmergencyCase) => void;
}

export const useReceptionStore = create<ReceptionState>((set, get) => ({
  walkIns: [],
  verifications: [],
  transfers: [],
  homeVisits: [],
  emergencies: [],
  dashboardData: null,
  patientSearchResults: [],
  isSearching: false,
  activePanel: 'walk-in',
  branchId: null,

  setBranch: (branchId) => {
    set({ branchId, dashboardData: null });
    get().fetchDashboardData(branchId);
  },

  fetchDashboardData: async (branchId) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    try {
      const res = await fetch(`/api/reception/dashboard?branchId=${bid}`);
      if (!res.ok) return;
      const data: ReceptionDashboardData = await res.json();
      set({ dashboardData: data });
    } catch {
      // silent
    }
  },

  fetchWalkIns: async (branchId, filters) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    const params = new URLSearchParams({ branchId: bid });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.searchQuery) params.set('search', filters.searchQuery);
    if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.set('dateTo', filters.dateTo);

    try {
      const res = await fetch(`/api/reception/walk-ins?${params.toString()}`);
      if (!res.ok) return;
      const data: WalkInRegistration[] = await res.json();
      set({ walkIns: data });
    } catch {
      // silent
    }
  },

  fetchVerifications: async (branchId, filters) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    const params = new URLSearchParams({ branchId: bid });
    if (filters?.status) params.set('status', filters.status);

    try {
      const res = await fetch(`/api/reception/insurance-verifications?${params.toString()}`);
      if (!res.ok) return;
      const data: InsuranceVerification[] = await res.json();
      set({ verifications: data });
    } catch {
      // silent
    }
  },

  fetchTransfers: async (branchId, type) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    const params = new URLSearchParams({ branchId: bid });
    if (type) params.set('type', type);

    try {
      const res = await fetch(`/api/reception/transfers?${params.toString()}`);
      if (!res.ok) return;
      const data: BranchTransfer[] = await res.json();
      set({ transfers: data });
    } catch {
      // silent
    }
  },

  fetchHomeVisits: async (branchId, filters) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    const params = new URLSearchParams({ branchId: bid });
    if (filters?.status) params.set('status', filters.status);
    if (filters?.searchQuery) params.set('search', filters.searchQuery);

    try {
      const res = await fetch(`/api/reception/home-visits?${params.toString()}`);
      if (!res.ok) return;
      const data: HomeVisitRequest[] = await res.json();
      set({ homeVisits: data });
    } catch {
      // silent
    }
  },

  fetchEmergencies: async (branchId) => {
    const bid = branchId ?? get().branchId;
    if (!bid) return;
    try {
      const res = await fetch(`/api/reception/emergencies?branchId=${bid}`);
      if (!res.ok) return;
      const data: EmergencyCase[] = await res.json();
      set({ emergencies: data });
    } catch {
      // silent
    }
  },

  searchPatients: async (query, branchId) => {
    const bid = branchId ?? get().branchId;
    if (!query || query.length < 2) {
      set({ patientSearchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    const params = new URLSearchParams({ q: query });
    if (bid) params.set('branchId', bid);

    try {
      const res = await fetch(`/api/reception/patients/search?${params.toString()}`);
      if (!res.ok) {
        set({ patientSearchResults: [], isSearching: false });
        return;
      }
      const data: PatientSearchResult[] = await res.json();
      set({ patientSearchResults: data, isSearching: false });
    } catch {
      set({ patientSearchResults: [], isSearching: false });
    }
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  addWalkIn: (walkIn) => {
    set((state) => ({ walkIns: [walkIn, ...state.walkIns] }));
  },

  addTransfer: (transfer) => {
    set((state) => ({ transfers: [transfer, ...state.transfers] }));
  },

  addHomeVisit: (homeVisit) => {
    set((state) => ({ homeVisits: [homeVisit, ...state.homeVisits] }));
  },

  addEmergency: (emergency) => {
    set((state) => ({ emergencies: [emergency, ...state.emergencies] }));
  },
}));

// ============================================================
// 3. RECEPTION UI STORE — UI state management
// ============================================================
type ModalKey =
  | 'walk-in'
  | 'insurance'
  | 'transfer'
  | 'home-visit'
  | 'emergency'
  | 'barcode';

interface ReceptionUIState {
  showWalkInModal: boolean;
  showInsuranceModal: boolean;
  showTransferModal: boolean;
  showHomeVisitModal: boolean;
  showEmergencyModal: boolean;
  showBarcodeModal: boolean;
  showQueueDisplay: boolean;
  showKeyboardShortcuts: boolean;
  selectedPrinter: PrinterConfig | null;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  compactMode: boolean;
  showPatientSearch: boolean;

  toggleModal: (modal: ModalKey) => void;
  closeAllModals: () => void;
  toggleQueueDisplay: () => void;
  toggleSound: () => void;
  setPrinter: (printer: PrinterConfig | null) => void;
  toggleCompactMode: () => void;
  togglePatientSearch: () => void;
}

export const useReceptionUIStore = create<ReceptionUIState>()(
  persist(
    (set) => ({
      showWalkInModal: false,
      showInsuranceModal: false,
      showTransferModal: false,
      showHomeVisitModal: false,
      showEmergencyModal: false,
      showBarcodeModal: false,
      showQueueDisplay: false,
      showKeyboardShortcuts: false,
      selectedPrinter: null,
      soundEnabled: true,
      theme: 'light',
      compactMode: false,
      showPatientSearch: false,

      toggleModal: (modal) => {
        const map: Record<ModalKey, keyof ReceptionUIState> = {
          'walk-in': 'showWalkInModal',
          insurance: 'showInsuranceModal',
          transfer: 'showTransferModal',
          'home-visit': 'showHomeVisitModal',
          emergency: 'showEmergencyModal',
          barcode: 'showBarcodeModal',
        };
        const key = map[modal];
        set((state) => ({ [key]: !state[key] } as Partial<ReceptionUIState>));
      },

      closeAllModals: () =>
        set({
          showWalkInModal: false,
          showInsuranceModal: false,
          showTransferModal: false,
          showHomeVisitModal: false,
          showEmergencyModal: false,
          showBarcodeModal: false,
          showKeyboardShortcuts: false,
        }),

      toggleQueueDisplay: () => set((s) => ({ showQueueDisplay: !s.showQueueDisplay })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setPrinter: (printer) => set({ selectedPrinter: printer }),
      toggleCompactMode: () => set((s) => ({ compactMode: !s.compactMode })),
      togglePatientSearch: () => set((s) => ({ showPatientSearch: !s.showPatientSearch })),
    }),
    {
      name: 'al-mokhtabar-reception-ui',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        theme: state.theme,
        compactMode: state.compactMode,
        selectedPrinter: state.selectedPrinter,
      }),
    }
  )
);

// ============================================================
// 4. KEYBOARD SHORTCUTS STORE
// ============================================================
interface KeyboardShortcutsState {
  shortcuts: KeyboardShortcut[];
  isEnabled: boolean;
  selectedCategory: string | null;

  registerShortcut: (shortcut: KeyboardShortcut) => void;
  removeShortcut: (id: string) => void;
  setCategory: (category: string | null) => void;
  toggleEnabled: () => void;
  executeShortcut: (key: string, modifiers: { ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) => KeyboardShortcut | null;
}

const defaultShortcuts: KeyboardShortcut[] = [
  { id: 'walk-in', key: 'F2', description: 'New Walk-In', descriptionAr: 'تسجيل حضوري جديد', action: 'open-walk-in', category: 'walk-in' },
  { id: 'search', key: 'F3', description: 'Patient Search', descriptionAr: 'بحث عن مريض', action: 'open-search', category: 'search' },
  { id: 'insurance', key: 'F4', description: 'New Insurance Verification', descriptionAr: 'تحقق من التأمين', action: 'open-insurance', category: 'walk-in' },
  { id: 'refresh', key: 'F5', description: 'Refresh Queue', descriptionAr: 'تحديث الطابور', action: 'refresh-queue', category: 'queue' },
  { id: 'call-next', key: 'F7', description: 'Call Next Patient', descriptionAr: 'استدعاء المريض التالي', action: 'call-next', category: 'queue' },
  { id: 'transfer', key: 'F8', description: 'New Transfer', descriptionAr: 'تحويل جديد', action: 'open-transfer', category: 'navigation' },
  { id: 'home-visit', key: 'F9', description: 'New Home Visit', descriptionAr: 'زيارة منزلية جديدة', action: 'open-home-visit', category: 'navigation' },
  { id: 'emergency', key: 'F10', description: 'New Emergency', descriptionAr: 'حالة طوارئ جديدة', action: 'open-emergency', category: 'navigation' },
  { id: 'print', key: 'p', ctrlKey: true, description: 'Print Ticket', descriptionAr: 'طباعة التذكرة', action: 'print-ticket', category: 'general' },
  { id: 'queue-display', key: 'q', ctrlKey: true, description: 'Toggle Queue Display', descriptionAr: 'عرض الطابور', action: 'toggle-queue-display', category: 'queue' },
  { id: 'escape', key: 'Escape', description: 'Close Modal / Cancel', descriptionAr: 'إلغاء / إغلاق', action: 'close-modal', category: 'general' },
];

export const useKeyboardShortcutsStore = create<KeyboardShortcutsState>((set, get) => ({
  shortcuts: [...defaultShortcuts],
  isEnabled: true,
  selectedCategory: null,

  registerShortcut: (shortcut) => {
    set((state) => {
      const exists = state.shortcuts.find((s) => s.id === shortcut.id);
      if (exists) {
        return {
          shortcuts: state.shortcuts.map((s) => (s.id === shortcut.id ? shortcut : s)),
        };
      }
      return { shortcuts: [...state.shortcuts, shortcut] };
    });
  },

  removeShortcut: (id) => {
    set((state) => ({
      shortcuts: state.shortcuts.filter((s) => s.id !== id),
    }));
  },

  setCategory: (category) => set({ selectedCategory: category }),

  toggleEnabled: () => set((s) => ({ isEnabled: !s.isEnabled })),

  executeShortcut: (key, modifiers) => {
    const { shortcuts, isEnabled } = get();
    if (!isEnabled) return null;

    const match = shortcuts.find(
      (s) =>
        s.key === key &&
        !!s.ctrlKey === modifiers.ctrlKey &&
        !!s.shiftKey === modifiers.shiftKey &&
        !!s.altKey === modifiers.altKey
    );

    return match ?? null;
  },
}));

// ============================================================
// 5. QUEUE DISPLAY STORE — Full-screen waiting area display
// ============================================================
type AnimationPhase = 'idle' | 'calling' | 'showing';

interface QueueDisplayState {
  isDisplayMode: boolean;
  currentBranch: string | null;
  calledEntry: QueueEntry | null;
  calledEntryVisible: boolean;
  animationPhase: AnimationPhase;

  enterDisplayMode: (branchId: string) => void;
  exitDisplayMode: () => void;
  callPatient: (entry: QueueEntry) => void;
  dismissCalled: () => void;
}

export const useQueueDisplayStore = create<QueueDisplayState>((set) => ({
  isDisplayMode: false,
  currentBranch: null,
  calledEntry: null,
  calledEntryVisible: false,
  animationPhase: 'idle',

  enterDisplayMode: (branchId) => {
    set({
      isDisplayMode: true,
      currentBranch: branchId,
      calledEntry: null,
      calledEntryVisible: false,
      animationPhase: 'idle',
    });
  },

  exitDisplayMode: () => {
    set({
      isDisplayMode: false,
      currentBranch: null,
      calledEntry: null,
      calledEntryVisible: false,
      animationPhase: 'idle',
    });
  },

  callPatient: (entry) => {
    set({
      calledEntry: entry,
      animationPhase: 'calling',
      calledEntryVisible: true,
    });

    setTimeout(() => {
      set({ animationPhase: 'showing' });
    }, 1500);
  },

  dismissCalled: () => {
    set({ calledEntryVisible: false, animationPhase: 'idle' });
    setTimeout(() => {
      set({ calledEntry: null });
    }, 500);
  },
}));
