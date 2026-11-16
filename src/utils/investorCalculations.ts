import { CapitalContribution, CapitalAllocation } from "../types";

export function getContributionAllocated(contributionId: string, allocations: CapitalAllocation[]): number {
  return allocations
    .filter((a) => a.contributionId === contributionId)
    .reduce((sum, a) => sum + a.amountAllocated, 0);
}

export function getContributionAvailable(contribution: CapitalContribution, allocations: CapitalAllocation[]): number {
  if (contribution.status !== "Approved") return 0;
  const allocated = getContributionAllocated(contribution.id, allocations);
  return Math.max(0, contribution.amount - allocated);
}

export function getInvestorApprovedTotal(investorId: string, contributions: CapitalContribution[]): number {
  return contributions
    .filter((c) => c.investorId === investorId && c.status === "Approved")
    .reduce((sum, c) => sum + c.amount, 0);
}

export function getInvestorUnallocated(investorId: string, contributions: CapitalContribution[], allocations: CapitalAllocation[]): number {
  return contributions
    .filter((c) => c.investorId === investorId)
    .reduce((sum, c) => sum + getContributionAvailable(c, allocations), 0);
}