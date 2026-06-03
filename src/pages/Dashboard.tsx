import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Chart, { type ChartConfiguration } from "chart.js/auto";
import { Save, UserPlus } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createAdminUser,
  getAdminDailyUsage,
  listAdminUsers,
  updateAdminUser,
} from "../api/adminUsers";
import {
  listAdminBudgetRequests,
  updateAdminBudgetRequest,
} from "../api/budgetRequests";
import { ApiError } from "../api/client";
import type { AppRole, BudgetRequest, DailyUsagePoint, User } from "../api/types";

const defaultPermissions = [
  "chat:use",
  "conversation:read",
  "conversation:write",
  "message:write",
  "files:upload",
];

type EditableUser = {
  role: AppRole;
  is_active: boolean;
  permissionsText: string;
  tokenBudgetText: string;
};

type DailyBarChartProps = {
  title: string;
  data: DailyUsagePoint[];
  valueKey: "active_users" | "total_tokens";
  color: string;
  valueLabel: string;
};

function parsePermissions(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

function formatChartDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function DailyBarChart({
  title,
  data,
  valueKey,
  color,
  valueLabel,
}: DailyBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    Chart.getChart(canvasRef.current)?.destroy();

    const config: ChartConfiguration<"bar", number[], string> = {
      type: "bar",
      data: {
        labels: data.map((item) => formatChartDate(item.date)),
        datasets: [
          {
            label: valueLabel,
            data: data.map((item) => item[valueKey]),
            backgroundColor: color,
            borderRadius: 4,
            maxBarThickness: 18,
          },
        ],
      },
      options: {
        animation: false,
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${valueLabel}: ${Number(context.parsed.y).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              autoSkip: true,
              maxRotation: 0,
              minRotation: 0,
              color: "#767586",
              font: {
                size: 11,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: "#767586",
              callback: (value) => Number(value).toLocaleString(),
              font: {
                size: 11,
              },
            },
            grid: {
              color: "#f0eded",
            },
          },
        },
      },
    };

    const chart = new Chart(canvasRef.current, config);

    return () => chart.destroy();
  }, [color, data, valueKey, valueLabel]);

  return (
    <div className="min-w-0 rounded-lg border border-[#e2e2e2] bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#1b1b1b]">{title}</h3>
        <span className="text-xs text-[#767586]">Last 30 days</span>
      </div>
      <div className="h-[250px] min-w-0">
        <canvas ref={canvasRef} aria-label={title} role="img" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const [microsoftOid, setMicrosoftOid] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("user");
  const [permissionsText, setPermissionsText] = useState(
    defaultPermissions.join(", "),
  );
  const [tokenBudget, setTokenBudget] = useState("100000");
  const [edits, setEdits] = useState<Record<string, EditableUser>>({});
  const [approvalAmounts, setApprovalAmounts] = useState<Record<string, string>>(
    {},
  );

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: ({ signal }) => listAdminUsers(signal),
  });

  const budgetRequestsQuery = useQuery({
    queryKey: ["admin-budget-requests"],
    queryFn: ({ signal }) => listAdminBudgetRequests(signal),
  });

  const dailyUsageQuery = useQuery({
    queryKey: ["admin-daily-usage", 30],
    queryFn: ({ signal }) => getAdminDailyUsage(30, signal),
  });

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      setMicrosoftOid("");
      setEmail("");
      setRole("user");
      setPermissionsText(defaultPermissions.join(", "));
      setTokenBudget("100000");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string;
      input: {
        role: AppRole;
        is_active: boolean;
        permissions: string[];
        token_budget: number;
      };
    }) => updateAdminUser(userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const decideBudgetRequestMutation = useMutation({
    mutationFn: ({
      request,
      status,
      approvedTokens,
    }: {
      request: BudgetRequest;
      status: "approved" | "rejected";
      approvedTokens?: number;
    }) =>
      updateAdminBudgetRequest(request.id, {
        status,
        approved_tokens: status === "approved" ? approvedTokens : null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-budget-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const dailyUsage = useMemo(
    () => dailyUsageQuery.data ?? [],
    [dailyUsageQuery.data],
  );

  const editableUsers = useMemo(() => {
    return users.reduce<Record<string, EditableUser>>((acc, user) => {
      acc[user.id] = {
        role: edits[user.id]?.role ?? user.role,
        is_active: edits[user.id]?.is_active ?? user.is_active,
        tokenBudgetText:
          edits[user.id]?.tokenBudgetText ?? String(user.token_budget),
        permissionsText:
          edits[user.id]?.permissionsText ?? user.permissions.join(", "),
      };
      return acc;
    }, {});
  }, [edits, users]);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate({
      microsoft_oid: microsoftOid,
      email: email.trim() || null,
      role,
      permissions: parsePermissions(permissionsText),
      token_budget: Number(tokenBudget) || 0,
    });
  };

  const setEdit = (userId: string, partial: Partial<EditableUser>) => {
    setEdits((current) => ({
      ...current,
      [userId]: {
        ...editableUsers[userId],
        ...partial,
      },
    }));
  };

  const saveUser = (user: User) => {
    const edit = editableUsers[user.id];

    updateMutation.mutate({
      userId: user.id,
      input: {
        role: edit.role,
        is_active: edit.is_active,
        permissions: parsePermissions(edit.permissionsText),
        token_budget: Number(edit.tokenBudgetText) || 0,
      },
    });
  };

  const decideBudgetRequest = (
    request: BudgetRequest,
    status: "approved" | "rejected",
  ) => {
    const approvedTokens =
      Number(approvalAmounts[request.id] || request.requested_tokens) || 0;

    decideBudgetRequestMutation.mutate({
      request,
      status,
      approvedTokens,
    });
  };

  return (
    <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1b1b1b]">
            Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-[#5d5f5e]">
            Create and manage Microsoft-authenticated chat users.
          </p>
        </div>

        <section className="overflow-hidden rounded-lg border border-[#e2e2e2] bg-white shadow-sm">
          <div className="border-b border-[#e2e2e2] px-4 py-3">
            <h2 className="text-base font-semibold">Usage analytics</h2>
          </div>

          {dailyUsageQuery.isLoading ? (
            <div className="px-4 py-8 text-sm text-[#5d5f5e]">
              Loading usage analytics...
            </div>
          ) : dailyUsageQuery.error ? (
            <div className="px-4 py-8 text-sm text-red-700">
              {getErrorMessage(dailyUsageQuery.error)}
            </div>
          ) : dailyUsage.length === 0 ? (
            <div className="px-4 py-8 text-sm text-[#5d5f5e]">
              No usage data yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
              <DailyBarChart
                title="Daily active users"
                data={dailyUsage}
                valueKey="active_users"
                color="#4648d4"
                valueLabel="Active users"
              />
              <DailyBarChart
                title="Daily token usage"
                data={dailyUsage}
                valueKey="total_tokens"
                color="#16a34a"
                valueLabel="Total tokens"
              />
            </div>
          )}
        </section>

        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-[#e2e2e2] bg-white p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-[#4648d4]" />
            <h2 className="text-base font-semibold">Create user</h2>
          </div>

          {createMutation.error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {getErrorMessage(createMutation.error)}
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1.2fr_0.7fr_0.8fr]">
            <label className="flex flex-col gap-1 text-sm font-medium text-[#464554]">
              Microsoft Object ID
              <input
                value={microsoftOid}
                onChange={(event) => setMicrosoftOid(event.target.value)}
                required
                maxLength={64}
                className="h-10 rounded-md border border-[#d4d4d8] bg-white px-3 text-sm text-[#1b1b1b] outline-none focus:border-[#4648d4]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-[#464554]">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                className="h-10 rounded-md border border-[#d4d4d8] bg-white px-3 text-sm text-[#1b1b1b] outline-none focus:border-[#4648d4]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-[#464554]">
              Role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as AppRole)}
                className="h-10 rounded-md border border-[#d4d4d8] bg-white px-3 text-sm text-[#1b1b1b] outline-none focus:border-[#4648d4]"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-[#464554]">
              Token budget
              <input
                value={tokenBudget}
                onChange={(event) => setTokenBudget(event.target.value)}
                min={0}
                type="number"
                className="h-10 rounded-md border border-[#d4d4d8] bg-white px-3 text-sm text-[#1b1b1b] outline-none focus:border-[#4648d4]"
              />
            </label>
          </div>

          <label className="mt-3 flex flex-col gap-1 text-sm font-medium text-[#464554]">
            Permissions
            <input
              value={permissionsText}
              onChange={(event) => setPermissionsText(event.target.value)}
              className="h-10 rounded-md border border-[#d4d4d8] bg-white px-3 text-sm text-[#1b1b1b] outline-none focus:border-[#4648d4]"
            />
          </label>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#4648d4] px-4 text-sm font-semibold text-white hover:bg-[#393bb7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={16} />
              {createMutation.isPending ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>

        <section className="overflow-hidden rounded-lg border border-[#e2e2e2] bg-white shadow-sm">
          <div className="border-b border-[#e2e2e2] px-4 py-3">
            <h2 className="text-base font-semibold">Budget requests</h2>
          </div>

          {budgetRequestsQuery.isLoading ? (
            <div className="px-4 py-8 text-sm text-[#5d5f5e]">
              Loading budget requests...
            </div>
          ) : budgetRequestsQuery.error ? (
            <div className="px-4 py-8 text-sm text-red-700">
              {getErrorMessage(budgetRequestsQuery.error)}
            </div>
          ) : (budgetRequestsQuery.data ?? []).length === 0 ? (
            <div className="px-4 py-8 text-sm text-[#5d5f5e]">
              No budget requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#f7f4f3] text-xs uppercase text-[#5d5f5e]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Requested</th>
                    <th className="px-4 py-3 font-semibold">Note</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Approve amount</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e2e2]">
                  {(budgetRequestsQuery.data ?? []).map((request) => (
                    <tr key={request.id}>
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-[#1b1b1b]">
                          {request.user_email ?? request.user_id}
                        </div>
                        <div className="text-xs text-[#767586]">
                          {new Date(request.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-[#464554]">
                        {request.requested_tokens.toLocaleString()}
                      </td>
                      <td className="max-w-[260px] px-4 py-3 align-top text-[#464554]">
                        {request.note ?? "None"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="rounded-md bg-[#f0eded] px-2 py-1 text-xs font-semibold capitalize text-[#464554]">
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <input
                          value={
                            approvalAmounts[request.id] ??
                            String(request.requested_tokens)
                          }
                          onChange={(event) =>
                            setApprovalAmounts((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          disabled={request.status !== "pending"}
                          min={1}
                          type="number"
                          className="h-9 w-32 rounded-md border border-[#d4d4d8] bg-white px-2 text-sm disabled:bg-[#f7f4f3]"
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={
                              request.status !== "pending" ||
                              decideBudgetRequestMutation.isPending
                            }
                            onClick={() => decideBudgetRequest(request, "approved")}
                            className="h-9 rounded-md border border-[#4648d4] px-3 text-sm font-medium text-[#4648d4] hover:bg-[#f3f3ff] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={
                              request.status !== "pending" ||
                              decideBudgetRequestMutation.isPending
                            }
                            onClick={() => decideBudgetRequest(request, "rejected")}
                            className="h-9 rounded-md border border-[#d4d4d8] px-3 text-sm font-medium text-[#464554] hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#e2e2e2] bg-white shadow-sm">
          <div className="border-b border-[#e2e2e2] px-4 py-3">
            <h2 className="text-base font-semibold">Users</h2>
          </div>

          {usersQuery.isLoading ? (
            <div className="px-4 py-8 text-sm text-[#5d5f5e]">Loading users...</div>
          ) : usersQuery.error ? (
            <div className="px-4 py-8 text-sm text-red-700">
              {getErrorMessage(usersQuery.error)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-[#f7f4f3] text-xs uppercase text-[#5d5f5e]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">OID</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Active</th>
                    <th className="px-4 py-3 font-semibold">Permissions</th>
                    <th className="px-4 py-3 font-semibold">Tokens</th>
                    <th className="px-4 py-3 font-semibold">Budget</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e2e2]">
                  {users.map((user) => {
                    const edit = editableUsers[user.id];
                    return (
                      <tr key={user.id}>
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-[#1b1b1b]">
                            {user.email ?? "No email"}
                          </div>
                          <div className="text-xs text-[#767586]">{user.id}</div>
                        </td>
                        <td className="max-w-[180px] px-4 py-3 align-top text-xs text-[#464554]">
                          <span className="block truncate">
                            {user.microsoft_oid ?? "None"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <select
                            value={edit.role}
                            onChange={(event) =>
                              setEdit(user.id, {
                                role: event.target.value as AppRole,
                              })
                            }
                            className="h-9 rounded-md border border-[#d4d4d8] bg-white px-2 text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={edit.is_active}
                            onChange={(event) =>
                              setEdit(user.id, {
                                is_active: event.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-[#4648d4]"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            value={edit.permissionsText}
                            onChange={(event) =>
                              setEdit(user.id, {
                                permissionsText: event.target.value,
                              })
                            }
                            className="h-9 w-full min-w-[260px] rounded-md border border-[#d4d4d8] bg-white px-2 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 align-top text-[#464554]">
                          <div>{user.total_tokens.toLocaleString()}</div>
                          <div className="text-xs text-[#767586]">
                            {Math.max(
                              user.token_budget - user.total_tokens,
                              0,
                            ).toLocaleString()}{" "}
                            remaining
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            value={edit.tokenBudgetText}
                            onChange={(event) =>
                              setEdit(user.id, {
                                tokenBudgetText: event.target.value,
                              })
                            }
                            min={0}
                            type="number"
                            className="h-9 w-32 rounded-md border border-[#d4d4d8] bg-white px-2 text-sm"
                          />
                          {user.total_tokens >= user.token_budget && (
                            <div className="mt-1 text-xs font-medium text-red-700">
                              Over budget
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => saveUser(user)}
                            disabled={updateMutation.isPending}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d4d4d8] bg-white px-3 text-sm font-medium text-[#464554] hover:border-[#4648d4] hover:text-[#4648d4] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Save size={15} />
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
