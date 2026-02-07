"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { type TierLevel, tierLabels } from "@/types";

interface AddResourceDialogProps {
  categories: { id: string; name: string }[];
  onAdd: (data: {
    title: string;
    description?: string;
    url: string;
    category: string;
    icon?: string;
    labels?: string;
    requiredTier?: TierLevel;
    isExternal?: boolean;
  }) => void;
  isLoading: boolean;
}

export function AddResourceDialog({
  categories,
  onAdd,
  isLoading,
}: AddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [labels, setLabels] = useState("");
  const [requiredTier, setRequiredTier] = useState<TierLevel | "none">("none");
  const [isExternal, setIsExternal] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !category) return;

    onAdd({
      title,
      description: description || undefined,
      url,
      category,
      labels: labels
        ? JSON.stringify(
            labels
              .split(",")
              .map((l) => l.trim())
              .filter(Boolean)
          )
        : undefined,
      requiredTier: requiredTier !== "none" ? requiredTier : undefined,
      isExternal,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setUrl("");
    setCategory("");
    setLabels("");
    setRequiredTier("none");
    setIsExternal(true);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>リソースを追加</DialogTitle>
          <DialogDescription>
            新しいリソースの情報を入力してください。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">タイトル *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="リソース名"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="リソースの説明..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>カテゴリ *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="labels">ラベル（カンマ区切り）</Label>
            <Input
              id="labels"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="重要, 新規, 必読"
            />
          </div>

          <div className="space-y-2">
            <Label>Tier制限</Label>
            <Select
              value={requiredTier}
              onValueChange={(v) =>
                setRequiredTier(v as TierLevel | "none")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="制限なし" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">制限なし</SelectItem>
                {(["1", "2", "3", "4", "5"] as TierLevel[]).map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tierLabels[tier]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="external">外部リンク</Label>
            <Switch
              id="external"
              checked={isExternal}
              onCheckedChange={setIsExternal}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            リソースを追加
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
