import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { agendaAPI } from '../lib/api';
import { Plus, Edit, Trash2, Save, X, Clock, CheckCircle } from 'lucide-react';

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
  const [newItem, setNewItem] = useState<Partial<AgendaItem>>({
    time: '',
    title: '',
    requiresCheckIn: false,
    isParallel: false,
  });
  const [selectedDay, setSelectedDay] = useState<string>('Day 1');

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
      console.error('Error fetching agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: AgendaItem) => {
    setEditingItem(item.id);
  };

  const handleSave = async (item: AgendaItem) => {
    try {
      await agendaAPI.updateAgendaItem(item.id, item);
      setEditingItem(null);
      fetchAgenda();
    } catch (error) {
      console.error('Error updating agenda item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this agenda item?')) {
      try {
        await agendaAPI.deleteAgendaItem(itemId);
        fetchAgenda();
      } catch (error) {
        console.error('Error deleting agenda item:', error);
      }
    }
  };

  const handleAddItem = async () => {
    if (!newItem.time || !newItem.title) return;

    try {
      const dayData = agenda.find(d => d.day === selectedDay);
      if (!dayData) return;

      const itemIndex = newItem.isParallel 
        ? dayData.parallel.length 
        : dayData.items.length;

      await agendaAPI.createAgendaItem({
        day: selectedDay,
        itemIndex,
        isParallel: newItem.isParallel || false,
        time: newItem.time,
        title: newItem.title,
        requiresCheckIn: newItem.requiresCheckIn || false,
        isActive: true,
      });

      setNewItem({ time: '', title: '', requiresCheckIn: false, isParallel: false });
      fetchAgenda();
    } catch (error) {
      console.error('Error creating agenda item:', error);
    }
  };

  const toggleCheckIn = async (item: AgendaItem) => {
    const updatedItem = { ...item, requiresCheckIn: !item.requiresCheckIn };
    await handleSave(updatedItem);
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
        <h1 className="text-3xl font-bold text-foreground">Agenda Management</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Time (e.g., 09:00-10:00)"
              value={newItem.time}
              onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
              className="bg-transparent"
            />
            <Input
              placeholder="Title"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="bg-transparent"
            />
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newItem.requiresCheckIn}
                  onChange={(e) => setNewItem({ ...newItem, requiresCheckIn: e.target.checked })}
                />
                <span className="text-sm">Requires Check-in</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newItem.isParallel}
                  onChange={(e) => setNewItem({ ...newItem, isParallel: e.target.checked })}
                />
                <span className="text-sm">Parallel</span>
              </label>
            </div>
            <Button onClick={handleAddItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
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
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-24 text-sm font-mono text-muted-foreground">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        {editingItem === item.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={item.title}
                              onChange={(e) => {
                                const updatedItems = agenda.map(d => 
                                  d.day === dayData.day 
                                    ? {
                                        ...d,
                                        items: d.items.map(i => 
                                          i.id === item.id ? { ...i, title: e.target.value } : i
                                        )
                                      }
                                    : d
                                );
                                setAgenda(updatedItems);
                              }}
                              className="bg-transparent"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSave(item)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>{item.title}</span>
                            {item.requiresCheckIn && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Check-in
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
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
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-24 text-sm font-mono text-muted-foreground">
                          {item.time}
                        </div>
                        <div className="flex-1">
                          {editingItem === item.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={item.title}
                                onChange={(e) => {
                                  const updatedItems = agenda.map(d => 
                                    d.day === dayData.day 
                                      ? {
                                          ...d,
                                          parallel: d.parallel.map(i => 
                                            i.id === item.id ? { ...i, title: e.target.value } : i
                                          )
                                        }
                                      : d
                                  );
                                  setAgenda(updatedItems);
                                }}
                                className="bg-transparent"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSave(item)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingItem(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>{item.title}</span>
                              {item.requiresCheckIn && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Check-in
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
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
