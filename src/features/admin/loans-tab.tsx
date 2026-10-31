"use client";

import { usePaginatedQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import { RequestBadges } from "@/components/badges";
import { CardHeader } from "@/components/card-header";
import { FilterPills } from "@/components/filter-pills";
import { PaginatedList } from "@/components/paginated-list";
import { formatDateRange } from "@/lib/dates";
import { card, mutedText } from "@/lib/styles";
import { ADMIN_PAGE_SIZE } from "./constants";

const STATUS_OPTIONS = [
  { value: "approved", label: "Active", emptyText: "No active loans." },
  { value: "returned", label: "Returned", emptyText: "No returned loans yet." },
  {
    value: "closed",
    label: "Closed",
    emptyText: "No loans closed by an admin.",
  },
] as const;

type LoanStatus = (typeof STATUS_OPTIONS)[number]["value"];

export function LoansTab() {
  const [status, setStatus] = useState<LoanStatus>("approved");
  const loans = usePaginatedQuery(
    api.admin.listLoans,
    { status },
    { initialNumItems: ADMIN_PAGE_SIZE },
  );

  return (
    <>
      <FilterPills
        label="Filter loans"
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
        className="mt-6"
      />
      <PaginatedList
        pagination={loans}
        pageSize={ADMIN_PAGE_SIZE}
        emptyText={
          STATUS_OPTIONS.find((option) => option.value === status)?.emptyText
        }
        renderItem={(loan) => (
          <li key={loan._id} className={card}>
            <CardHeader title={loan.toolName}>
              <RequestBadges request={loan} />
            </CardHeader>
            <p className={`mt-1 ${mutedText}`}>
              {formatDateRange(loan.startDate, loan.endDate)}
            </p>
            <p className="mt-2 text-sm">
              {loan.lenderName ?? "A former member"} lent to{" "}
              {loan.borrowerName ?? "a former member"}
            </p>
          </li>
        )}
      />
    </>
  );
}
