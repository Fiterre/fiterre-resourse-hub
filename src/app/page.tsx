"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Settings,
  LogOut,
  Loader2,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Users,
  FolderOpen,
  Globe,
  FileText,
  Smartphone,
  MessageCircle,
  Calculator,
  Dumbbell,
  Moon,
  Sun,
  ChevronLeft,
} from "lucide-react";
import { useTheme } from "next-themes";

// アイコンマップ
const iconMap: Record<string, any> = {
  settings: Settings,
  "file-text": FileText,
  "app-window": Smartphone,
  dumbbell: Dumbbell,
  "message-circle": MessageCircle,
  calculator: Calculator,
  globe: Globe,
  folder: FolderOpen,
};

// デフォルトカテゴリ
const defaultCategories = [
  { id: "management", name: "管理サイト", icon: "settings", color: "#3B82F6" },
  { id: "document", name: "資料", icon: "file-text", color: "#22C55E" },
  { id: "app", name: "アプリ", icon: "app-window", color: "#A855F7" },
  { id: "training", name: "トレーニング", icon: "dumbbell", color: "#F97316" },
  { id: "communication", name: "コミュニケーション", icon: "message-circle", color: "#EC4899" },
  { id: "finance", name: "経理・財務", icon: "calculator", color: "#EAB308" },
];

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [deletingResource, setDeletingResource] = useState<any>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Form state
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    description: "",
    category: "",
  });

  // Categories state
  const categories = defaultCategories;

  // tRPC queries
  const {
    data: resources = [],
    isLoading: resourcesLoading,
    refetch: refetchResources,
  } = trpc.resources.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // tRPC mutations
  const createResource = trpc.resources.create.useMutation({
    onSuccess: () => {
      toast.success("追加しました");
      refetchResources();
      setIsAddResourceOpen(false);
      setNewResource({ title: "", url: "", description: "", category: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateResource = trpc.resources.update.useMutation({
    onSuccess: () => {
      toast.success("更新しました");
      refetchResources();
      setEditingResource(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteResource = trpc.resources.delete.useMutation({
    onSuccess: () => {
      toast.success("削除しました");
      refetchResources();
      setDeletingResource(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const logAccess = trpc.accessLogs.create.useMutation();

  // Filtered resources
  const filteredResources = useMemo(() => {
    let result = resources;

    if (selectedCategory) {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          (r.description || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, searchQuery, resources]);

  // Resource counts by category
  const resourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [resources]);

  const isTier1 = user?.tier === "1";

  // Handle resource click
  const handleResourceClick = (resource: any) => {
    logAccess.mutate({
      resourceId: resource.id,
      resourceTitle: resource.title,
      resourceUrl: resource.url,
      action: "view",
    });
    window.open(resource.url, "_blank", "noopener,noreferrer");
  };

  // Open all resources in category
  const openAllInCategory = () => {
    filteredResources.forEach((resource, index) => {
      setTimeout(() => {
        window.open(resource.url, "_blank", "noopener,noreferrer");
      }, index * 100);
    });
    toast.success(filteredResources.length + "件のリソースを開きました");
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  // Category folder view (home)
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold">Fiterre Hub</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Search */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg"
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {resourcesLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : searchQuery ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                検索結果: {filteredResources.length}件
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {filteredResources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => handleResourceClick(resource)}
                    className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: categories.find(c => c.id === resource.category)?.color || "#6B7280" }}
                    >
                      <ExternalLink className="h-6 w-6" />
                    </div>
                    <span className="text-xs text-center line-clamp-2">{resource.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || FolderOpen;
                const count = resourceCounts[category.id] || 0;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all hover:scale-105 active:scale-95"
                  >
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white shadow-xl"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{count}件</p>
                    </div>
                  </button>
                );
              })}
              {isTier1 && (
                <button
                  onClick={() => setIsCategorySettingsOpen(true)}
                  className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all border-2 border-dashed border-gray-300 dark:border-gray-600"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Plus className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-500">カテゴリ設定</p>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>設定</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {(user?.name || "U")[0]}
                </div>
                <div>
                  <p className="font-medium">{user?.name || "ユーザー"}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              {isTier1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">管理者メニュー</p>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setIsSettingsOpen(false); setIsUserManagementOpen(true); }}>
                    <Users className="h-4 w-4 mr-2" />ユーザー管理
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setIsSettingsOpen(false); setIsCategorySettingsOpen(true); }}>
                    <FolderOpen className="h-4 w-4 mr-2" />カテゴリ設定
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span>ダークモード</span>
                <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={"w-12 h-7 rounded-full transition-colors " + (theme === "dark" ? "bg-primary" : "bg-gray-300")}>
                  <div className={"w-5 h-5 rounded-full bg-white shadow transform transition-transform " + (theme === "dark" ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>
              <Button variant="destructive" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />ログアウト
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Settings Dialog */}
        <Dialog open={isCategorySettingsOpen} onOpenChange={setIsCategorySettingsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>カテゴリ設定</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || FolderOpen;
                return (
                  <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: category.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1">{category.name}</span>
                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-center text-gray-500">カテゴリはコード内で管理されています</p>
          </DialogContent>
        </Dialog>

        {/* User Management Dialog */}
        {isTier1 && <UserManagementDialogSimple open={isUserManagementOpen} onOpenChange={setIsUserManagementOpen} />}
      </div>
    );
  }

  // Category detail view
  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const CategoryIcon = iconMap[currentCategory?.icon || "folder"] || FolderOpen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSelectedCategory(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: currentCategory?.color }}>
            <CategoryIcon className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold flex-1">{currentCategory?.name}</h1>
          {filteredResources.length > 0 && (
            <Button size="sm" variant="outline" onClick={openAllInCategory} className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />すべて開く
            </Button>
          )}
          {isTier1 && (
            <button onClick={() => { setNewResource({ ...newResource, category: selectedCategory }); setIsAddResourceOpen(true); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredResources.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>リソースがありません</p>
            {isTier1 && (
              <Button className="mt-4" onClick={() => { setNewResource({ ...newResource, category: selectedCategory }); setIsAddResourceOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />追加する
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="relative group">
                <button onClick={() => handleResourceClick(resource)} className="w-full flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all active:scale-95">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: currentCategory?.color }}>
                    <ExternalLink className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-center line-clamp-2 leading-tight">{resource.title}</span>
                </button>
                {isTier1 && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingResource(resource); }} className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingResource(resource); }} className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>リソースを追加</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="text-sm font-medium">タイトル</label><Input value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} placeholder="例: Google Drive" /></div>
            <div><label className="text-sm font-medium">URL</label><Input value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} placeholder="https://..." /></div>
            <div><label className="text-sm font-medium">説明（任意）</label><Input value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} placeholder="メモ" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddResourceOpen(false)}>キャンセル</Button>
            <Button onClick={() => createResource.mutate(newResource)} disabled={!newResource.title || !newResource.url || createResource.isPending}>
              {createResource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>リソースを編集</DialogTitle></DialogHeader>
          {editingResource && (
            <div className="space-y-4 py-4">
              <div><label className="text-sm font-medium">タイトル</label><Input value={editingResource.title} onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium">URL</label><Input value={editingResource.url} onChange={(e) => setEditingResource({ ...editingResource, url: e.target.value })} /></div>
              <div><label className="text-sm font-medium">説明</label><Input value={editingResource.description || ""} onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })} /></div>
              <div><label className="text-sm font-medium">カテゴリ</label>
                <select value={editingResource.category} onChange={(e) => setEditingResource({ ...editingResource, category: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-800">
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResource(null)}>キャンセル</Button>
            <Button onClick={() => updateResource.mutate({ id: editingResource.id, title: editingResource.title, url: editingResource.url, description: editingResource.description, category: editingResource.category })} disabled={updateResource.isPending}>
              {updateResource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingResource} onOpenChange={(open) => !open && setDeletingResource(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="py-4">「{deletingResource?.title}」を削除しますか？この操作は取り消せません。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingResource(null)}>キャンセル</Button>
            <Button variant="destructive" onClick={() => deleteResource.mutate({ id: deletingResource.id })} disabled={deleteResource.isPending}>
              {deleteResource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserManagementDialogSimple({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: users = [], refetch } = trpc.users.list.useQuery(undefined, { enabled: open });
  const updateTier = trpc.users.updateTier.useMutation({ onSuccess: () => { toast.success("更新しました"); refetch(); }, onError: (e) => toast.error(e.message) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>ユーザー管理</DialogTitle></DialogHeader>
        <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{(user.name || "U")[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name || "名前なし"}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <select value={user.tier} onChange={(e) => updateTier.mutate({ userId: user.id, tier: e.target.value as any })} className="text-sm p-1 border rounded dark:bg-gray-700">
                <option value="1">Tier 1 (管理者)</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
                <option value="5">Tier 5</option>
              </select>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
