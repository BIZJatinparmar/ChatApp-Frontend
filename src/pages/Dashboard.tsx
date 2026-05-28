import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, UserPlus } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  createAdminUser,
  listAdminUsers,
  updateAdminUser,
} from "../api/adminUsers";
import { ApiError } from "../api/client";
import type { AppRole, User } from "../api/types";

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

export function Dashboard() {
  const queryClient = useQueryClient();
  const [microsoftOid, setMicrosoftOid] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("user");
  const [permissionsText, setPermissionsText] = useState(
    defaultPermissions.join(", "),
  );
  const [edits, setEdits] = useState<Record<string, EditableUser>>({});

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: ({ signal }) => listAdminUsers(signal),
  });

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      setMicrosoftOid("");
      setEmail("");
      setRole("user");
      setPermissionsText(defaultPermissions.join(", "));
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
      };
    }) => updateAdminUser(userId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const users = usersQuery.data ?? [];

  const editableUsers = useMemo(() => {
    return users.reduce<Record<string, EditableUser>>((acc, user) => {
      acc[user.id] = {
        role: edits[user.id]?.role ?? user.role,
        is_active: edits[user.id]?.is_active ?? user.is_active,
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
      },
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

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1.2fr_0.7fr]">
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
                          {user.total_tokens}
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
