"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { FilterPills } from "@/components/filter-pills";
import { AutomationTab } from "@/features/admin/automation-tab";
import { LendersTab } from "@/features/admin/lenders-tab";
import { ListingsTab } from "@/features/admin/listings-tab";
import { LoansTab } from "@/features/admin/loans-tab";
import { mutedText, pageTitle } from "@/lib/styles";

const TABS = [
  { value: "loans", label: "Loans" },
  { value: "lenders", label: "Lenders" },
  { value: "listings", label: "Listings" },
  { value: "automation", label: "Automation" },
] as const;
type Tab = (typeof TABS)[number]["value"];

export default function AdminPage() {
  const me = useQuery(api.users.me);
  const [tab, setTab] = useState<Tab>("loans");

  if (me === undefined) {
    return <p className={mutedText}>Loading…</p>;
  }
  if (me?.role !== "admin") {
    return (
      <section role="alert">
        <h1 className={pageTitle}>Admins only</h1>
        <p className={`mt-2 ${mutedText}`}>
          You don&apos;t have access to this page.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1 className={pageTitle}>Admin</h1>
      <FilterPills
        label="Admin sections"
        options={TABS}
        value={tab}
        onChange={setTab}
        className="mt-4 border-b border-line pb-3"
      />
      {tab === "loans" && <LoansTab />}
      {tab === "lenders" && <LendersTab />}
      {tab === "listings" && <ListingsTab />}
      {tab === "automation" && <AutomationTab />}
    </section>
  );
}
