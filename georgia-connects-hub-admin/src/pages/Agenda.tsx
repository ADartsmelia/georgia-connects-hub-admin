import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { agendaAPI } from "../lib/api";
import { Plus, Edit, Trash2, Save, X, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AgendaItem {
  id: string;
  day: string;
  itemIndex: number;
  isParallel: boolean;
  time: string;
  title: string;
  requiresCheckIn: boolean;
  isActive: boolean;
}

interface DayAgenda {
  day: string;
  items: AgendaItem[];
  parallel: AgendaItem[];
}

export default function Agenda() {
  const [agenda, setAgenda] = useState<DayAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingItemData, setEditingItemData] = useState<AgendaItem | null>(
    null
  );
  const [newItem, setNewItem] = useState<Partial<AgendaItem>>({
    time: "",
    title: "",
    requiresCheckIn: false,
    isParallel: false,
  });
  const [selectedDay, setSelectedDay] = useState<string>("Day 1");

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const response = await agendaAPI.getAgenda();
      if (response.success) {
        setAgenda(response.data);
      }
    } catch (error) {
      console.error("Error fetching agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: AgendaItem) => {
    setEditingItem(item.id);
    setEditingItemData({ ...item });
  };

  const handleSave = async () => {
    if (!editingItemData) return;

    try {
      await agendaAPI.updateAgendaItem(editingItemData.id, editingItemData);
      setEditingItem(null);
      setEditingItemData(null);
      fetchAgenda();
      toast.success("Agenda item updated successfully!");
    } catch (error) {
      console.error("Error updating agenda item:", error);
      toast.error("Failed to update agenda item");
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingItemData(null);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this agenda item?")) {
      try {
        await agendaAPI.deleteAgendaItem(itemId);
        fetchAgenda();
        toast.success("Agenda item deleted successfully!");
      } catch (error) {
        console.error("Error deleting agenda item:", error);
        toast.error("Failed to delete agenda item");
      }
    }
  };

  const handleAddItem = async () => {
    if (!newItem.time || !newItem.title) {
      toast.error("Please fill in time and title");
      return;
    }

    try {
      const dayData = agenda.find((d) => d.day === selectedDay);
      if (!dayData) {
        toast.error("Invalid day selected");
        return;
      }

      // Calculate next available index by finding max itemIndex and adding 1
      const relevantItems = newItem.isParallel
        ? dayData.parallel
        : dayData.items;
      const maxIndex =
        relevantItems.length > 0
          ? Math.max(...relevantItems.map((item) => item.itemIndex))
          : -1;
      const itemIndex = maxIndex + 1;

      await agendaAPI.createAgendaItem({
        day: selectedDay,
        itemIndex,
        isParallel: newItem.isParallel || false,
        time: newItem.time,
        title: newItem.title,
        requiresCheckIn: newItem.requiresCheckIn || false,
        isActive: true,
      });

      setNewItem({
        time: "",
        title: "",
        requiresCheckIn: false,
        isParallel: false,
      });
      fetchAgenda();
      toast.success("Agenda item added successfully!");
    } catch (error: any) {
      console.error("Error creating agenda item:", error);
      const message =
        error.response?.data?.message || "Failed to add agenda item";
      toast.error(message);
    }
  };

  const toggleCheckIn = async (item: AgendaItem) => {
    try {
      const updatedItem = { ...item, requiresCheckIn: !item.requiresCheckIn };
      await agendaAPI.updateAgendaItem(item.id, updatedItem);
      fetchAgenda();
      toast.success("Check-in status updated!");
    } catch (error) {
      console.error("Error updating check-in status:", error);
      toast.error("Failed to update check-in status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading agenda...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Agenda Management
        </h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-2 border rounded-md bg-transparent"
          >
            {agenda.map((day) => (
              <option key={day.day} value={day.day}>
                {day.day}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Agenda Item</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-3 py-2 border rounded-md bg-transparent"
              >
                {agenda.map((day) => (
                  <option key={day.day} value={day.day}>
                    {day.day}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Time (e.g., 09:00-10:00)"
                value={newItem.time || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, time: e.target.value })
                }
                className="bg-transparent"
              />
              <Input
                placeholder="Title"
                value={newItem.title || ""}
                onChange={(e) =>
                  setNewItem({ ...newItem, title: e.target.value })
                }
                className="md:col-span-2 bg-transparent"
              />
              <Button
                onClick={handleAddItem}
                className="w-full"
                disabled={!newItem.time || !newItem.title}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.requiresCheckIn || false}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      requiresCheckIn: e.target.checked,
                    })
                  }
                  className="cursor-pointer"
                />
                <span className="text-sm">Requires Check-in</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newItem.isParallel || false}
                  onChange={(e) =>
                    setNewItem({ ...newItem, isParallel: e.target.checked })
                  }
                  className="cursor-pointer"
                />
                <span className="text-sm">Parallel Session</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Days */}
      {agenda.map((dayData) => (
        <Card key={dayData.day}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{dayData.day}</span>
              <Badge variant="outline">
                {dayData.items.length + dayData.parallel.length} items
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Main Schedule
              </h3>
              <div className="space-y-2">
                {dayData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    {editingItem === item.id && editingItemData ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <select
                          value={editingItemData.day}
                          onChange={(e) =>
                            setEditingItemData({
                              ...editingItemData,
                              day: e.target.value,
                            })
                          }
                          className="px-2 py-1 border rounded-md bg-transparent text-sm w-24"
                        >
                          {agenda.map((day) => (
                            <option key={day.day} value={day.day}>
                              {day.day}
                            </option>
                          ))}
                        </select>
                        <Input
                          placeholder="Time"
                          value={editingItemData.time}
                          onChange={(e) =>
                            setEditingItemData({
                              ...editingItemData,
                              time: e.target.value,
                            })
                          }
                          className="w-32 bg-transparent"
                        />
                        <Input
                          placeholder="Title"
                          value={editingItemData.title}
                          onChange={(e) =>
                            setEditingItemData({
                              ...editingItemData,
                              title: e.target.value,
                            })
                          }
                          className="flex-1 bg-transparent"
                        />
                        <Button
                          size="sm"
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-32 text-sm font-mono text-muted-foreground">
                          {item.time}
                        </div>
                        <div className="flex items-center space-x-2 flex-1">
                          <span>{item.title}</span>
                          {item.requiresCheckIn && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Check-in
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCheckIn(item)}
                        className={item.requiresCheckIn ? "bg-green-100" : ""}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parallel Items */}
            {dayData.parallel.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Parallel Activities
                </h3>
                <div className="space-y-2">
                  {dayData.parallel.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 bg-blue-50"
                    >
                      {editingItem === item.id && editingItemData ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <select
                            value={editingItemData.day}
                            onChange={(e) =>
                              setEditingItemData({
                                ...editingItemData,
                                day: e.target.value,
                              })
                            }
                            className="px-2 py-1 border rounded-md bg-transparent text-sm w-24"
                          >
                            {agenda.map((day) => (
                              <option key={day.day} value={day.day}>
                                {day.day}
                              </option>
                            ))}
                          </select>
                          <Input
                            placeholder="Time"
                            value={editingItemData.time}
                            onChange={(e) =>
                              setEditingItemData({
                                ...editingItemData,
                                time: e.target.value,
                              })
                            }
                            className="w-32 bg-transparent"
                          />
                          <Input
                            placeholder="Title"
                            value={editingItemData.title}
                            onChange={(e) =>
                              setEditingItemData({
                                ...editingItemData,
                                title: e.target.value,
                              })
                            }
                            className="flex-1 bg-transparent"
                          />
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-32 text-sm font-mono text-muted-foreground">
                            {item.time}
                          </div>
                          <div className="flex items-center space-x-2 flex-1">
                            <span>{item.title}</span>
                            {item.requiresCheckIn && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Check-in
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleCheckIn(item)}
                          className={item.requiresCheckIn ? "bg-green-100" : ""}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
