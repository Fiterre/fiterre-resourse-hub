"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserManagementDialog } from "@/components/UserManagementDialog";
import { InvitationDialog } from "@/components/InvitationDialog";
import { DomainSettingsDialog } from "@/components/DomainSettingsDialog";
import { AccessLogDialog } from "@/components/AccessLogDialog";
import { AddResourceDialog } from "@/components/AddResourceDialog";
import { EditResourceDialog } from "@/components/EditResourceDialog";
import { DeleteResourceDialog } from "@/components/DeleteResourceDialog";
import { ResourceCard } from "@/components/ResourceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Menu,
  X,
  Shield,
  Users,
  History,
  UserPlus,
  Globe,
  Settings,
  LogOut,
  Loader2,
  Dumbbell,
  LayoutGrid,
  FolderOpen,
} from "lucide-react";
import { tierLabels, tierColors, type TierLevel } from "@/types";

// Category definitions
const categoryConfig: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  management: {
    label: "管理サイト",
    icon: "settings",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  document: {
    label: "資料",
    icon: "file-text",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  app: {
    label: "アプリ",
    icon: "app-window",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  training: {
    label: "トレーニング",
    icon: "dumbbell",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  communication: {
    label: "コミュニケーション",
    icon: "message-circle",
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  },
  finance: {
    label: "経理・財務",
    icon: "calculator",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
};

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [deletingResource, setDeletingResource] = useState<any>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isAccessLogOpen, setIsAccessLogOpen] = useState(false);

  // Fetch resources
  const {
    data: resources = [],
    isLoading: resourcesLoading,
    refetch: refetchResources,
  } = trpc.resources.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Fetch categories
  const { data: dbCategories = [] } = trpc.categories.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const createResource = trpc.resources.create.useMutation({
    onSuccess: () => {
      toast.success("リソースを追加しました");
      refetchResources();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateResource = trpc.resources.update.useMutation({
    onSuccess: () => {
      toast.success("リソースを更新しました");
      refetchResources();
      setEditingResource(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteResource = trpc.resources.delete.useMutation({
    onSuccess: () => {
      toast.success("リソースを削除しました");
      refetchResources();
      setDeletingResource(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleFavorite = trpc.resources.update.useMutation({
    onSuccess: () => refetchResources(),
  });

  // Log access
  const logAccess = trpc.accessLogs.create.useMutation();

  // Derived data
  const allLabels = useMemo(() => {
    const labelSet = new Set<string>();
    resources.forEach((r) => {
      if (r.labels) {
        try {
          const parsed = JSON.parse(r.labels);
          if (Array.isArray(parsed)) {
            parsed.forEach((l: string) => labelSet.add(l));
          }
        } catch {
          // ignore
        }
      }
    });
    return Array.from(labelSet).sort();
  }, [resources]);

  const resourceCounts = useMemo(() => {
    const counts: Record<string, number> = { all: resources.length };
    resources.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [resources]);

  const filteredResources = useMemo(() => {
    let result = resources;

    if (selectedCategory !== "all") {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          (r.description || "").toLowerCase().includes(query) ||
          (r.labels || "").toLowerCase().includes(query)
      );
    }

    if (selectedLabel) {
      result = result.filter((r) => {
        if (!r.labels) return false;
        try {
          const parsed = JSON.parse(r.labels);
          return Array.isArray(parsed) && parsed.includes(selectedLabel);
        } catch {
          return false;
        }
      });
    }

    return result;
  }, [selectedCategory, searchQuery, selectedLabel, resources]);

  const isTier1 = user?.tier === "1";

  // Handle resource click
  const handleResourceClick = (resource: any) => {
    logAccess.mutate({
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceUrl: resource.url,
      action: "view",
    });

    if (resource.isExternal) {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = resource.url;
    }
  };

  // Redirect to login if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-sm">Fiterre</h2>
                <p className="text-xs text-muted-foreground">Resource Hub</p>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="ml-auto lg:hidden p-1 rounded hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                selectedCategory === "all"
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>すべて</span>
              <span className="ml-auto text-xs opacity-60">
                {resourceCounts.all || 0}
              </span>
            </button>

            {Object.entries(categoryConfig).map(([id, config]) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedCategory(id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                <span>{config.label}</span>
                <span className="ml-auto text-xs opacity-60">
                  {resourceCounts[id] || 0}
                </span>
              </button>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-border/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {(user?.name || "U")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || "ユーザー"}
                </p>
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${tierColors[(user?.tier || "5") as TierLevel]}`}
                  variant="secondary"
                >
                  {tierLabels[(user?.tier || "5") as TierLevel]}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="リソースを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {isTier1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUserManagementOpen(true)}
                    className="hidden sm:flex gap-2"
                  >
                    <Users className="h-4 w-4" />
                    ユーザー管理
                  </Button>

                  <InvitationDialog />
                  <DomainSettingsDialog />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAccessLogOpen(true)}
                    className="hidden sm:flex gap-2"
                  >
                    <History className="h-4 w-4" />
                    ログ
                  </Button>
                </>
              )}

              <AddResourceDialog
                categories={Object.entries(categoryConfig).map(
                  ([id, config]) => ({
                    id,
                    name: config.label,
                  })
                )}
                onAdd={(data) => createResource.mutate(data)}
                isLoading={createResource.isPending}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-6">
          {/* Label Filter */}
          {allLabels.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLabel(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedLabel === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                すべて
              </button>
              {allLabels.map((label) => (
                <button
                  key={label}
                  onClick={() =>
                    setSelectedLabel(selectedLabel === label ? null : label)
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedLabel === label
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Resources Grid */}
          {resourcesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FolderOpen className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">リソースが見つかりません</p>
              <p className="text-sm mt-1">
                検索条件を変更するか、新しいリソースを追加してください
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  categoryConfig={categoryConfig}
                  onClick={() => handleResourceClick(resource)}
                  onEdit={() => setEditingResource(resource)}
                  onDelete={() => setDeletingResource(resource)}
                  onToggleFavorite={() =>
                    toggleFavorite.mutate({
                      id: resource.id,
                      isFavorite: !resource.isFavorite,
                    })
                  }
                  isTier1={isTier1}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dialogs */}
      {isTier1 && (
        <>
          <UserManagementDialog
            open={isUserManagementOpen}
            onOpenChange={setIsUserManagementOpen}
          />
          <AccessLogDialog
            open={isAccessLogOpen}
            onOpenChange={setIsAccessLogOpen}
          />
        </>
      )}

      {editingResource && (
        <EditResourceDialog
          resource={editingResource}
          categories={Object.entries(categoryConfig).map(([id, config]) => ({
            id,
            name: config.label,
          }))}
          open={!!editingResource}
          onOpenChange={(open) => !open && setEditingResource(null)}
          onSave={(data) => updateResource.mutate({ id: editingResource.id, ...data })}
          isLoading={updateResource.isPending}
        />
      )}

      {deletingResource && (
        <DeleteResourceDialog
          resource={deletingResource}
          open={!!deletingResource}
          onOpenChange={(open) => !open && setDeletingResource(null)}
          onConfirm={() => deleteResource.mutate({ id: deletingResource.id })}
          isLoading={deleteResource.isPending}
        />
      )}
    </div>
  );
}
