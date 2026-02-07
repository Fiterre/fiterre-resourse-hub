"use client";

import { useState, useMemo, useEffect } from "react";
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
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Zap,
  Shield,
  Lock,
} from "lucide-react";
import { useTheme } from "next-themes";
import { type TierLevel, tierLabels, tierDescriptions } from "@/types";

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
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  heart: Heart,
  star: Star,
  zap: Zap,
};

const iconOptions = [
  { id: "settings", label: "設定" },
  { id: "file-text", label: "ファイル" },
  { id: "app-window", label: "アプリ" },
  { id: "dumbbell", label: "ダンベル" },
  { id: "message-circle", label: "メッセージ" },
  { id: "calculator", label: "計算機" },
  { id: "globe", label: "地球" },
  { id: "folder", label: "フォルダ" },
  { id: "briefcase", label: "ブリーフケース" },
  { id: "graduation-cap", label: "卒業帽" },
  { id: "heart", label: "ハート" },
  { id: "star", label: "星" },
  { id: "zap", label: "稲妻" },
];

const colorOptions = [
  { id: "#3B82F6", label: "青" },
  { id: "#22C55E", label: "緑" },
  { id: "#A855F7", label: "紫" },
  { id: "#F97316", label: "オレンジ" },
  { id: "#EC4899", label: "ピンク" },
  { id: "#EAB308", label: "黄" },
  { id: "#EF4444", label: "赤" },
  { id: "#14B8A6", label: "ティール" },
  { id: "#6366F1", label: "インディゴ" },
];

// デフォルトカテゴリ
const defaultCategories = [
  { id: "management", name: "管理サイト", icon: "settings", color: "#3B82F6", requiredTier: null as TierLevel | null },
  { id: "document", name: "資料", icon: "file-text", color: "#22C55E", requiredTier: null as TierLevel | null },
  { id: "app", name: "アプリ", icon: "app-window", color: "#A855F7", requiredTier: null as TierLevel | null },
  { id: "training", name: "トレーニング", icon: "dumbbell", color: "#F97316", requiredTier: null as TierLevel | null },
  { id: "communication", name: "コミュニケーション", icon: "message-circle", color: "#EC4899", requiredTier: null as TierLevel | null },
  { id: "finance", name: "経理・財務", icon: "calculator", color: "#EAB308", requiredTier: "1" as TierLevel | null },
];

// Tier Colors for badges
const tierBadgeColors: Record<TierLevel, string> = {
  "1": "bg-red-500",
  "2": "bg-orange-500",
  "3": "bg-yellow-500",
  "4": "bg-blue-500",
  "5": "bg-green-500",
};

type Category = { id: string; name: string; icon: string; color: string; requiredTier?: TierLevel | null };

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const isTier1 = user?.tier === "1";

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isCategorySettingsOpen, setIsCategorySettingsOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [deletingResource, setDeletingResource] = useState<any>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Category management state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "folder", color: "#3B82F6", requiredTier: null as TierLevel | null });

  // Load categories from DB
  const {
    data: dbCategories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = trpc.categories.listAll.useQuery(undefined, {
    enabled: isAuthenticated && isTier1,
  });

  const {
    data: userCategories,
    refetch: refetchUserCategories,
  } = trpc.categories.list.useQuery(undefined, {
    enabled: isAuthenticated && !isTier1,
  });

  // Merge DB categories with defaults (for migration)
  const categories = useMemo(() => {
    const cats = isTier1 ? dbCategories : userCategories;
    if (cats && cats.length > 0) {
      return cats.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || "folder",
        color: c.color || "#3B82F6",
        requiredTier: c.requiredTier as TierLevel | null,
      }));
    }
    return defaultCategories;
  }, [dbCategories, userCategories, isTier1]);

  // Category mutations
  const createCategoryMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを追加しました");
      refetchCategories();
      refetchUserCategories();
      setIsAddCategoryOpen(false);
      setNewCategory({ name: "", icon: "folder", color: "#3B82F6", requiredTier: null });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCategoryMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを更新しました");
      refetchCategories();
      refetchUserCategories();
      setEditingCategory(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategoryMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("カテゴリを削除しました");
      refetchCategories();
      refetchUserCategories();
      setDeletingCategory(null);
    },
    onError: (e) => toast.error(e.message),
  });

  // Sync default categories to DB on first load (migration)
  const syncCategoryMutation = trpc.categories.syncAll.useMutation();
  useEffect(() => {
    if (isTier1 && dbCategories && dbCategories.length === 0) {
      syncCategoryMutation.mutate(defaultCategories.map((c, i) => ({
        ...c,
        sortOrder: i,
        requiredTier: c.requiredTier || undefined,
      })));
    }
  }, [isTier1, dbCategories]);

  // Form state
  const [newResource, setNewResource] = useState({
    title: "",
    url: "",
    description: "",
    category: "",
    requiredTier: null as TierLevel | null,
  });

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
      setNewResource({ title: "", url: "", description: "", category: "", requiredTier: null });
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

  // Category CRUD handlers
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("カテゴリ名を入力してください");
      return;
    }
    createCategoryMutation.mutate({
      id: "cat-" + Date.now(),
      name: newCategory.name,
      icon: newCategory.icon,
      color: newCategory.color,
      requiredTier: newCategory.requiredTier || undefined,
      sortOrder: categories.length,
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    if (!editingCategory.name.trim()) {
      toast.error("カテゴリ名を入力してください");
      return;
    }
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: editingCategory.name,
      icon: editingCategory.icon,
      color: editingCategory.color,
      requiredTier: editingCategory.requiredTier || undefined,
    });
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;
    deleteCategoryMutation.mutate({ id: deletingCategory.id });
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fiterre Hub</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === "dark" ? <Sun className="h-5 w-5 text-gray-700 dark:text-gray-200" /> : <Moon className="h-5 w-5 text-gray-700 dark:text-gray-200" />}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-200" />
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
              className="pl-12 h-12 rounded-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-lg text-gray-900 dark:text-white"
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
                    className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg relative"
                      style={{ backgroundColor: categories.find(c => c.id === resource.category)?.color || "#6B7280" }}
                    >
                      <ExternalLink className="h-6 w-6" />
                    </div>
                    {resource.requiredTier && (
                      <div className={"absolute top-1 right-1 px-1 py-0.5 rounded text-[9px] text-white font-bold " + tierBadgeColors[resource.requiredTier as TierLevel]}>
                        T{resource.requiredTier}
                      </div>
                    )}
                    <span className="text-xs text-center line-clamp-2 text-gray-900 dark:text-white">{resource.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-6">
              {categories.map((category) => {
                const Icon = iconMap[category.icon] || FolderOpen;
                const count = resourceCounts[category.id] || 0;
                const userTier = parseInt(user?.tier || "5");
                const categoryTier = category.requiredTier ? parseInt(category.requiredTier) : null;
                const hasAccess = !categoryTier || userTier <= categoryTier;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => hasAccess ? setSelectedCategory(category.id) : toast.error(`このカテゴリはTier ${category.requiredTier}以上の権限が必要です`)}
                    className={"flex flex-col items-center gap-3 p-4 rounded-3xl transition-all hover:scale-105 active:scale-95 relative " + (hasAccess ? "hover:bg-white/50 dark:hover:bg-gray-800/50" : "opacity-60 cursor-not-allowed")}
                  >
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white shadow-xl relative"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
                      {!hasAccess && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                    {category.requiredTier && (
                      <div className={"absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] text-white font-bold " + tierBadgeColors[category.requiredTier as TierLevel]}>
                        T{category.requiredTier}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</p>
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
                    <Plus className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">カテゴリ設定</p>
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
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name || "ユーザー"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                {user?.tier && (
                  <div className={"px-2 py-1 rounded text-xs text-white font-bold " + tierBadgeColors[user.tier as TierLevel]}>
                    Tier {user.tier}
                  </div>
                )}
              </div>
              
              {/* Tier Information Section */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">あなたの権限レベル</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className={"inline-block px-2 py-0.5 rounded text-white font-bold mr-2 " + tierBadgeColors[user?.tier as TierLevel || "5"]}>
                      {tierLabels[user?.tier as TierLevel || "5"]}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {tierDescriptions[user?.tier as TierLevel || "5"]}
                  </p>
                </div>
                <div className="border-t border-blue-200 dark:border-blue-700 pt-2 mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">利用可能なリソース:</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Tier {user?.tier || "5"} 以下の制限がかかったリソースとカテゴリにアクセスできます。
                  </p>
                </div>
              </div>

              {isTier1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">管理者メニュー</p>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setIsSettingsOpen(false); setIsUserManagementOpen(true); }}>
                    <Users className="h-4 w-4 mr-2" />ユーザー管理
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => { setIsSettingsOpen(false); setIsCategorySettingsOpen(true); }}>
                    <FolderOpen className="h-4 w-4 mr-2" />カテゴリ設定
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-gray-900 dark:text-gray-100">ダークモード</span>
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white relative" style={{ backgroundColor: category.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1 text-gray-900 dark:text-gray-100">{category.name}</span>
                    {category.requiredTier && (
                      <span className={"px-2 py-0.5 rounded text-xs text-white font-bold " + tierBadgeColors[category.requiredTier as TierLevel]}>
                        T{category.requiredTier}
                      </span>
                    )}
                    <button onClick={() => setEditingCategory(category)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                      <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button onClick={() => setDeletingCategory(category)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button onClick={() => { setIsCategorySettingsOpen(false); setIsAddCategoryOpen(true); }} className="w-full">
                <Plus className="h-4 w-4 mr-2" />カテゴリを追加
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>カテゴリを追加</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">カテゴリ名</label>
                <Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="例: マーケティング" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">アイコン</label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((opt) => {
                    const Icon = iconMap[opt.id] || FolderOpen;
                    return (
                      <button key={opt.id} onClick={() => setNewCategory({ ...newCategory, icon: opt.id })} className={"p-2 rounded-lg transition-colors " + (newCategory.icon === opt.id ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700")}>
                        <Icon className="h-5 w-5 mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">カラー</label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((opt) => (
                    <button key={opt.id} onClick={() => setNewCategory({ ...newCategory, color: opt.id })} className={"w-8 h-8 rounded-full transition-all " + (newCategory.color === opt.id ? "ring-2 ring-offset-2 ring-primary dark:ring-offset-gray-900" : "")} style={{ backgroundColor: opt.id }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  <Shield className="inline h-4 w-4 mr-1" />閲覧権限（Tier制限）
                </label>
                <select
                  value={newCategory.requiredTier || "none"}
                  onChange={(e) => setNewCategory({ ...newCategory, requiredTier: e.target.value === "none" ? null : e.target.value as TierLevel })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="none">制限なし（全員がアクセス可能）</option>
                  <option value="1">{tierLabels["1"]}</option>
                  <option value="2">{tierLabels["2"]}</option>
                  <option value="3">{tierLabels["3"]}</option>
                  <option value="4">{tierLabels["4"]}</option>
                  <option value="5">{tierLabels["5"]}</option>
                </select>
                {newCategory.requiredTier && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    <Lock className="inline h-3 w-3 mr-1" />
                    {tierDescriptions[newCategory.requiredTier]}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>キャンセル</Button>
              <Button onClick={handleAddCategory}>追加</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>カテゴリを編集</DialogTitle>
            </DialogHeader>
            {editingCategory && (
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">カテゴリ名</label>
                  <Input value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">アイコン</label>
                  <div className="grid grid-cols-6 gap-2">
                    {iconOptions.map((opt) => {
                      const Icon = iconMap[opt.id] || FolderOpen;
                      return (
                        <button key={opt.id} onClick={() => setEditingCategory({ ...editingCategory, icon: opt.id })} className={"p-2 rounded-lg transition-colors " + (editingCategory.icon === opt.id ? "bg-primary text-white" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700")}>
                          <Icon className="h-5 w-5 mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">カラー</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((opt) => (
                      <button key={opt.id} onClick={() => setEditingCategory({ ...editingCategory, color: opt.id })} className={"w-8 h-8 rounded-full transition-all " + (editingCategory.color === opt.id ? "ring-2 ring-offset-2 ring-primary dark:ring-offset-gray-900" : "")} style={{ backgroundColor: opt.id }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                    <Shield className="inline h-4 w-4 mr-1" />閲覧権限（Tier制限）
                  </label>
                  <select
                    value={editingCategory.requiredTier || "none"}
                    onChange={(e) => setEditingCategory({ ...editingCategory, requiredTier: e.target.value === "none" ? null : e.target.value as TierLevel })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="none">制限なし（全員がアクセス可能）</option>
                    <option value="1">{tierLabels["1"]}</option>
                    <option value="2">{tierLabels["2"]}</option>
                    <option value="3">{tierLabels["3"]}</option>
                    <option value="4">{tierLabels["4"]}</option>
                    <option value="5">{tierLabels["5"]}</option>
                  </select>
                  {editingCategory.requiredTier && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      <Lock className="inline h-3 w-3 mr-1" />
                      {tierDescriptions[editingCategory.requiredTier]}
                    </p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>キャンセル</Button>
              <Button onClick={handleUpdateCategory}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation */}
        <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>カテゴリを削除</DialogTitle>
            </DialogHeader>
            <p className="py-4 text-gray-700 dark:text-gray-300">「{deletingCategory?.name}」を削除しますか？<br /><span className="text-sm text-gray-500 dark:text-gray-400">このカテゴリ内のリソースは削除されません。</span></p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingCategory(null)}>キャンセル</Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>削除</Button>
            </DialogFooter>
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
            <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: currentCategory?.color }}>
            <CategoryIcon className="h-4 w-4" />
          </div>
          <h1 className="text-lg font-bold flex-1 text-gray-900 dark:text-white">{currentCategory?.name}</h1>
          {filteredResources.length > 0 && (
            <Button size="sm" variant="outline" onClick={openAllInCategory} className="text-xs">
              <ExternalLink className="h-3 w-3 mr-1" />すべて開く
            </Button>
          )}
          {isTier1 && (
            <button onClick={() => { setNewResource({ ...newResource, category: selectedCategory }); setIsAddResourceOpen(true); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Plus className="h-5 w-5 text-gray-700 dark:text-gray-200" />
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
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg relative" style={{ backgroundColor: currentCategory?.color }}>
                    <ExternalLink className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-center line-clamp-2 leading-tight text-gray-900 dark:text-white">{resource.title}</span>
                </button>
                {resource.requiredTier && (
                  <div className={"absolute top-1 left-1 px-1 py-0.5 rounded text-[9px] text-white font-bold " + tierBadgeColors[resource.requiredTier as TierLevel]}>
                    T{resource.requiredTier}
                  </div>
                )}
                {isTier1 && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingResource(resource); }} className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                      <Pencil className="h-3 w-3 text-gray-600 dark:text-gray-300" />
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
            <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">タイトル</label><Input value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} placeholder="例: Google Drive" /></div>
            <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL</label><Input value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} placeholder="https://..." /></div>
            <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">説明（任意）</label><Input value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} placeholder="メモ" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Shield className="h-4 w-4" />閲覧権限（Tier制限）
              </label>
              <select
                value={newResource.requiredTier || "none"}
                onChange={(e) => setNewResource({ ...newResource, requiredTier: e.target.value === "none" ? null : e.target.value as TierLevel })}
                className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="none">制限なし（全員がアクセス可能）</option>
                <option value="1">{tierLabels["1"]}</option>
                <option value="2">{tierLabels["2"]}</option>
                <option value="3">{tierLabels["3"]}</option>
                <option value="4">{tierLabels["4"]}</option>
                <option value="5">{tierLabels["5"]}</option>
              </select>
              {newResource.requiredTier && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  <Lock className="inline h-3 w-3 mr-1" />
                  {tierDescriptions[newResource.requiredTier]}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddResourceOpen(false)}>キャンセル</Button>
            <Button onClick={() => createResource.mutate({ ...newResource, requiredTier: newResource.requiredTier || undefined })} disabled={!newResource.title || !newResource.url || createResource.isPending}>
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
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">タイトル</label><Input value={editingResource.title} onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL</label><Input value={editingResource.url} onChange={(e) => setEditingResource({ ...editingResource, url: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">説明</label><Input value={editingResource.description || ""} onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300">カテゴリ</label>
                <select value={editingResource.category} onChange={(e) => setEditingResource({ ...editingResource, category: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Shield className="h-4 w-4" />閲覧権限（Tier制限）
                </label>
                <select
                  value={editingResource.requiredTier || "none"}
                  onChange={(e) => setEditingResource({ ...editingResource, requiredTier: e.target.value === "none" ? null : e.target.value as TierLevel })}
                  className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="none">制限なし（全員がアクセス可能）</option>
                  <option value="1">{tierLabels["1"]}</option>
                  <option value="2">{tierLabels["2"]}</option>
                  <option value="3">{tierLabels["3"]}</option>
                  <option value="4">{tierLabels["4"]}</option>
                  <option value="5">{tierLabels["5"]}</option>
                </select>
                {editingResource.requiredTier && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    <Lock className="inline h-3 w-3 mr-1" />
                    {tierDescriptions[editingResource.requiredTier as TierLevel]}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingResource(null)}>キャンセル</Button>
            <Button onClick={() => updateResource.mutate({ id: editingResource.id, title: editingResource.title, url: editingResource.url, description: editingResource.description, category: editingResource.category, requiredTier: editingResource.requiredTier || null })} disabled={updateResource.isPending}>
              {updateResource.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirmation Dialog */}
      <Dialog open={!!deletingResource} onOpenChange={(open) => !open && setDeletingResource(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>削除の確認</DialogTitle></DialogHeader>
          <p className="py-4 text-gray-700 dark:text-gray-300">「{deletingResource?.title}」を削除しますか？この操作は取り消せません。</p>
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
  const [tab, setTab] = useState<"users" | "invite">("users");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTier, setInviteTier] = useState<"1" | "2" | "3" | "4" | "5">("5");
  const [editingUser, setEditingUser] = useState<{ id: number; name: string; email: string; newPassword: string } | null>(null);

  const { data: users = [], refetch } = trpc.users.list.useQuery(undefined, { enabled: open });
  const { data: invitations = [], refetch: refetchInvitations } = trpc.invitations.list.useQuery(undefined, { enabled: open && tab === "invite" });

  const updateTier = trpc.users.updateTier.useMutation({ onSuccess: () => { toast.success("更新しました"); refetch(); }, onError: (e) => toast.error(e.message) });
  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => { toast.success("プロフィールを更新しました"); refetch(); setEditingUser(null); },
    onError: (e) => toast.error(e.message),
  });
  const createInvitation = trpc.invitations.create.useMutation({
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/register?token=${data.token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("招待リンクをコピーしました。メールやチャットで相手に送ってください。", { duration: 5000 });
      setInviteEmail("");
      setInviteTier("5");
      refetchInvitations();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteInvitation = trpc.invitations.delete.useMutation({ onSuccess: () => { toast.success("削除しました"); refetchInvitations(); }, onError: (e) => toast.error(e.message) });

  const handleInvite = () => {
    if (!inviteEmail) { toast.error("メールアドレスを入力してください"); return; }
    createInvitation.mutate({ email: inviteEmail, initialTier: inviteTier, expiresInDays: 7 });
  };

  const handleUpdateProfile = () => {
    if (!editingUser) return;
    if (!editingUser.name.trim()) { toast.error("名前を入力してください"); return; }
    if (!editingUser.email.trim()) { toast.error("メールアドレスを入力してください"); return; }
    if (editingUser.newPassword && editingUser.newPassword.length < 8) { toast.error("パスワードは8文字以上にしてください"); return; }
    updateProfile.mutate({
      userId: editingUser.id,
      name: editingUser.name,
      email: editingUser.email,
      password: editingUser.newPassword || undefined,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>ユーザー管理</DialogTitle></DialogHeader>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
            <button onClick={() => setTab("users")} className={"px-3 py-1 rounded-lg text-sm " + (tab === "users" ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800")}>ユーザー一覧</button>
            <button onClick={() => setTab("invite")} className={"px-3 py-1 rounded-lg text-sm " + (tab === "invite" ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800")}>招待</button>
          </div>

          {tab === "users" ? (
            <div className="space-y-3 py-2 max-h-80 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{(user.name || "U")[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-gray-900 dark:text-gray-100">{user.name || "名前なし"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => setEditingUser({ id: user.id, name: user.name || "", email: user.email || "", newPassword: "" })} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                    <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <select value={user.tier} onChange={(e) => updateTier.mutate({ userId: user.id, tier: e.target.value as any })} className="text-sm p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                    <option value="4">Tier 4</option>
                    <option value="5">Tier 5</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Create invitation form */}
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                <strong>招待の流れ：</strong> 招待作成 → リンクをコピー → メール/チャットで送信
              </div>
              <div className="flex gap-2">
                <Input placeholder="メールアドレス" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="flex-1" />
                <select value={inviteTier} onChange={(e) => setInviteTier(e.target.value as any)} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option value="1">Tier 1</option>
                  <option value="2">Tier 2</option>
                  <option value="3">Tier 3</option>
                  <option value="4">Tier 4</option>
                  <option value="5">Tier 5</option>
                </select>
                <Button onClick={handleInvite} disabled={createInvitation.isPending}>
                  {createInvitation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "招待"}
                </Button>
              </div>

              {/* Pending invitations */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">保留中の招待</p>
                {invitations.filter(i => i.status === "pending" && new Date(i.expiresAt) > new Date()).map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                    <span className="flex-1 truncate text-gray-900 dark:text-gray-100">{inv.email}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Tier {inv.initialTier}</span>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?token=${inv.token}`); toast.success("コピーしました"); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                      <ExternalLink className="h-3 w-3" />
                    </button>
                    <button onClick={() => deleteInvitation.mutate({ id: inv.id })} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {invitations.filter(i => i.status === "pending" && new Date(i.expiresAt) > new Date()).length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">保留中の招待はありません</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>ユーザーを編集</DialogTitle></DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">名前</label>
                <Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">メールアドレス</label>
                <Input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">新しいパスワード（変更する場合のみ）</label>
                <Input type="password" value={editingUser.newPassword} onChange={(e) => setEditingUser({ ...editingUser, newPassword: e.target.value })} placeholder="8文字以上" className="mt-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">空欄のままにすると、パスワードは変更されません</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>キャンセル</Button>
            <Button onClick={handleUpdateProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
