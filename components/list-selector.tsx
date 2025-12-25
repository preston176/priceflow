"use client";

import { useState } from "react";
import { Plus, FolderOpen, Archive, Pencil, Trash2, MoreVertical, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { List } from "@/db/schema";
import { createList, archiveList, duplicateList, deleteList } from "@/actions/list-actions";
import { LIST_TEMPLATES } from "@/lib/constants";
import { useRouter } from "next/navigation";

interface ListSelectorProps {
  lists: List[];
  currentListId?: string;
  onListChange: (listId: string) => void;
}

export function ListSelector({
  lists,
  currentListId,
  onListChange,
}: ListSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
  });
  const [useTemplate, setUseTemplate] = useState<string | null>(null);

  const currentList = lists.find((l) => l.id === currentListId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newList = await createList(formData);
      setFormData({ name: "", description: "", budget: "" });
      setUseTemplate(null);
      setOpen(false);
      onListChange(newList.id);
    } catch (error) {
      console.error("Failed to create list:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: typeof LIST_TEMPLATES[0]) => {
    setFormData({
      name: template.name,
      description: template.description,
      budget: "",
    });
    setUseTemplate(template.name);
  };

  const handleArchive = async () => {
    if (!currentListId) return;
    setActionLoading(true);
    try {
      await archiveList(currentListId);
      router.refresh();
    } catch (error) {
      console.error("Failed to archive list:", error);
      alert(error instanceof Error ? error.message : "Failed to archive list");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!currentListId) return;
    setActionLoading(true);
    try {
      const newList = await duplicateList(currentListId);
      onListChange(newList.id);
      router.refresh();
    } catch (error) {
      console.error("Failed to duplicate list:", error);
      alert(error instanceof Error ? error.message : "Failed to duplicate list");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentListId) return;
    if (!confirm("Are you sure you want to delete this list? This action cannot be undone.")) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteList(currentListId);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete list:", error);
      alert(error instanceof Error ? error.message : "Failed to delete list");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentListId} onValueChange={onListChange}>
        <SelectTrigger className="w-[250px]">
          <FolderOpen className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Select a list" />
        </SelectTrigger>
        <SelectContent>
          {lists.map((list) => (
            <SelectItem key={list.id} value={list.id}>
              {list.name}
              {list.isDefault && " (Default)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentListId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={actionLoading}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate for Next Year
            </DropdownMenuItem>
            {!currentList?.isDefault && (
              <>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-3">
              <Label>Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                {LIST_TEMPLATES.map((template) => (
                  <Button
                    key={template.name}
                    type="button"
                    variant={useTemplate === template.name ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">List Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="e.g., Christmas 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What's this list for?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({ ...formData, budget: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create List"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
