"use client";

import { useState } from "react";
import { Plus, FolderOpen, Archive, Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { List } from "@/db/schema";
import { createList, LIST_TEMPLATES } from "@/actions/list-actions";

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
  });
  const [useTemplate, setUseTemplate] = useState<string | null>(null);

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
