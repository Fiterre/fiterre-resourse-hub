"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Save, Loader2, Lock, Shield } from "lucide-react";
import { type TierLevel, tierLabels, tierDescriptions } from "@/types";

interface EditResourceDialogProps {
  resource: any;
  categories: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  isLoading: boolean;
}

export function EditResourceDialog({
  resource,
  categories,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: EditResourceDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [labels, setLabels] = useState("");
  const [requiredTier, setRequiredTier] = useState<TierLevel | "none">("none");
  const [isExternal, setIsExternal] = useState(true);

  useEffect(() => {
    if (resource) {
      setTitle(resource.title || "");
      setDescription(resource.description || "");
      setUrl(resource.url || "");
      setCategory(resource.category || "");
      setIsExternal(resource.isExternal ?? true);
      setRequiredTier(resource.requiredTier || "none");
      try {
        const parsed = JSON.parse(resource.labels || "[]");
        setLabels(Array.isArray(parsed) ? parsed.join(", ") : "");
      } catch {
        setLabels("");
      }
    }
  }, [resource]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
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
      requiredTier: requiredTier !== "none" ? requiredTier : null,
      isExternal,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>リソースを編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>タイトル</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>説明</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>カテゴリ</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
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
            <Label>ラベル（カンマ区切り）</Label>
            <Input value={labels} onChange={(e) => setLabels(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Tier制限（閲覧権限）
            </Label>
            <Select
              value={requiredTier}
              onValueChange={(v) => setRequiredTier(v as TierLevel | "none")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">制限なし（全員がアクセス可能）</SelectItem>
                {(["1", "2", "3", "4", "5"] as TierLevel[]).map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tierLabels[tier]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {requiredTier !== "none" && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                <Lock className="inline h-3 w-3 mr-1" />
                {tierDescriptions[requiredTier as TierLevel]}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label>外部リンク</Label>
            <Switch checked={isExternal} onCheckedChange={setIsExternal} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
