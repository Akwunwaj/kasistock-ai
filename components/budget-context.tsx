"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "kasistock.available-budget-rand";
const DEFAULT_BUDGET_RAND = 1500;
const CHANGE_EVENT = "kasistock-budget-change";

type BudgetContextValue = {
  budgetRand: number;
  setBudgetRand: (value: number) => void;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);

function readBudget() {
  const storedValue = Number(window.localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(storedValue) && storedValue >= 100 ? storedValue : DEFAULT_BUDGET_RAND;
}

function subscribeToBudget(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const budgetRand = useSyncExternalStore(subscribeToBudget, readBudget, () => DEFAULT_BUDGET_RAND);

  const value = useMemo(
    () => ({
      budgetRand,
      setBudgetRand: (nextValue: number) => {
        if (Number.isFinite(nextValue) && nextValue >= 100) {
          window.localStorage.setItem(STORAGE_KEY, String(Math.round(nextValue * 100) / 100));
          window.dispatchEvent(new Event(CHANGE_EVENT));
        }
      },
    }),
    [budgetRand],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error("useBudget must be used inside BudgetProvider");
  return context;
}
