import { create } from "zustand";
import { Investor, CapitalContribution, CapitalAllocation, CapitalReclaim, ContributionStatus } from "../types";
import { getContributionAvailable } from "../utils/investorCalculations";
import { useLoanStore } from "./loanStore";

const INVESTORS_KEY    = "cyberlend_investors";
const CONTRIBUTIONS_KEY = "cyberlend_contributions";
const ALLOCATIONS_KEY  = "cyberlend_allocations";
const RECLAIMS_KEY     = "cyberlend_reclaims";

function loadInvestors(): Investor[] { try { const r = localStorage.getItem(INVESTORS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function loadContributions(): CapitalContribution[] { try { const r = localStorage.getItem(CONTRIBUTIONS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function loadAllocations(): CapitalAllocation[] { try { const r = localStorage.getItem(ALLOCATIONS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function loadReclaims(): CapitalReclaim[] { try { const r = localStorage.getItem(RECLAIMS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }

function saveInvestors(v: Investor[]) { localStorage.setItem(INVESTORS_KEY, JSON.stringify(v)); }
function saveContributions(v: CapitalContribution[]) { localStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(v)); }
function saveAllocations(v: CapitalAllocation[]) { localStorage.setItem(ALLOCATIONS_KEY, JSON.stringify(v)); }
function saveReclaims(v: CapitalReclaim[]) { localStorage.setItem(RECLAIMS_KEY, JSON.stringify(v)); }

interface InvestorState {
  investors:     Investor[];
  contributions: CapitalContribution[];
  allocations:   CapitalAllocation[];
  reclaims:      CapitalReclaim[];

  addInvestor:       (data: Omit<Investor, "id" | "dateJoined">) => void;
  updateInvestor:    (id: string, updates: Partial<Investor>) => void;
  deleteInvestor:    (id: string) => void;

  addContribution:      (data: Omit<CapitalContribution, "id" | "status">) => void;
  setContributionStatus: (id: string, status: ContributionStatus) => void;
  deleteContribution:   (id: string) => void;

  allocateCapital:   (contributionId: string, loanId: string, amount: number) => { ok: boolean; message?: string };
  releaseAllocation: (allocationId: string) => void;
  releaseAllocationsForLoan: (loanId: string) => void;

  addReclaim:    (data: Omit<CapitalReclaim, "id">) => void;
  deleteReclaim: (id: string) => void;
}

export const useInvestorStore = create<InvestorState>((set, get) => ({
  investors:     loadInvestors(),
  contributions: loadContributions(),
  allocations:   loadAllocations(),
  reclaims:      loadReclaims(),

  addInvestor: (data) => set((state) => {
    const investor: Investor = { ...data, id: `INV-${Date.now()}`, dateJoined: new Date().toISOString().slice(0, 10) };
    const updated = [...state.investors, investor];
    saveInvestors(updated);
    return { investors: updated };
  }),

  updateInvestor: (id, updates) => set((state) => {
    const updated = state.investors.map((i) => i.id === id ? { ...i, ...updates } : i);
    saveInvestors(updated);
    return { investors: updated };
  }),

  deleteInvestor: (id) => set((state) => {
    const updated = state.investors.filter((i) => i.id !== id);
    saveInvestors(updated);
    return { investors: updated };
  }),

  addContribution: (data) => set((state) => {
    const contribution: CapitalContribution = { ...data, id: `CC-${Date.now()}`, status: "Pending" };
    const updated = [...state.contributions, contribution];
    saveContributions(updated);
    return { contributions: updated };
  }),

  setContributionStatus: (id, status) => set((state) => {
    const target = state.contributions.find((c) => c.id === id);
    if (!target) return state;
    const wasApproved = target.status === "Approved";
    const willBeApproved = status === "Approved";
    const updated = state.contributions.map((c) => c.id === id ? { ...c, status } : c);
    saveContributions(updated);

    if (wasApproved !== willBeApproved) {
      const delta = willBeApproved ? target.amount : -target.amount;
      const loanState = useLoanStore.getState();
      loanState.setTotalCapital(loanState.totalCapital + delta);
    }
    return { contributions: updated };
  }),

  deleteContribution: (id) => set((state) => {
    const target = state.contributions.find((c) => c.id === id);
    const updated = state.contributions.filter((c) => c.id !== id);
    saveContributions(updated);
    if (target?.status === "Approved") {
      const loanState = useLoanStore.getState();
      loanState.setTotalCapital(loanState.totalCapital - target.amount);
    }
    const remainingAllocations = get().allocations.filter((a) => a.contributionId !== id);
    saveAllocations(remainingAllocations);
    return { contributions: updated, allocations: remainingAllocations };
  }),

  allocateCapital: (contributionId, loanId, amount) => {
    const state = get();
    const contribution = state.contributions.find((c) => c.id === contributionId);
    if (!contribution) return { ok: false, message: "Contribution not found" };
    const available = getContributionAvailable(contribution, state.allocations);
    if (amount > available) {
      return { ok: false, message: `Only ${available} available on this contribution` };
    }
    const loan = useLoanStore.getState().loans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: "Loan not found" };

    const allocation: CapitalAllocation = {
      id: `ALLOC-${Date.now()}`,
      contributionId,
      investorId: contribution.investorId,
      loanId,
      amountAllocated: amount,
      share: amount / loan.loanAmount,
      date: new Date().toISOString().slice(0, 10),
    };
    const updated = [...state.allocations, allocation];
    saveAllocations(updated);
    set({ allocations: updated });
    return { ok: true };
  },

  releaseAllocation: (allocationId) => set((state) => {
    const updated = state.allocations.filter((a) => a.id !== allocationId);
    saveAllocations(updated);
    return { allocations: updated };
  }),

  releaseAllocationsForLoan: (loanId) => set((state) => {
    const updated = state.allocations.filter((a) => a.loanId !== loanId);
    saveAllocations(updated);
    return { allocations: updated };
  }),

  addReclaim: (data) => set((state) => {
    const reclaim: CapitalReclaim = { ...data, id: `RCL-${Date.now()}` };
    const updated = [...state.reclaims, reclaim];
    saveReclaims(updated);
    return { reclaims: updated };
  }),

  deleteReclaim: (id) => set((state) => {
    const updated = state.reclaims.filter((r) => r.id !== id);
    saveReclaims(updated);
    return { reclaims: updated };
  }),
}));