import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Users,
  Clock,
  Search,
  Filter,
  User,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { checkInsAPI } from "@/lib/api";
import { config } from "@/config/environment";

interface AgendaEvent {
  id: string;
  day: string;
  time: string;
  title: string;
  requiresCheckIn: boolean;
  checkInCount: number;
  isParallel: boolean;
}

interface Analytics {
  checkInStats: Array<{
    totalCheckIns: string;
    uniqueUsers: string;
  }>;
  totalUniqueUsers: number;
  checkInsByDay: Array<{
    date: string;
    count: string;
  }>;
}

export const CheckIns: React.FC = () => {
  const [agendaEvents, setAgendaEvents] = useState<AgendaEvent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("");

  const fetchAgendaEvents = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching agenda events with check-in counts...");

      // Get agenda data from the agenda API
      const agendaResponse = await fetch(`${config.API_URL}/admin/agenda`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_auth_token")}`,
          "Content-Type": "application/json",
        },
      });

      const agendaData = await agendaResponse.json();
      console.log("📊 Agenda API response:", agendaData);

      // Flatten agenda data and add check-in counts
      const events: AgendaEvent[] = [];

      if (agendaData.success && agendaData.data) {
        agendaData.data.forEach((day: any) => {
          // Add main agenda items - only those that require check-in
          day.items.forEach((item: any) => {
            if (item.requiresCheckIn) {
              events.push({
                id: item.id,
                day: day.day,
                time: item.time,
                title: item.title,
                requiresCheckIn: item.requiresCheckIn,
                checkInCount: item.checkInCount || 0,
                isParallel: false,
              });
            }
          });

          // Add parallel activities - only those that require check-in
          if (day.parallel && day.parallel.length > 0) {
            day.parallel.forEach((item: any) => {
              if (item.requiresCheckIn) {
                events.push({
                  id: item.id,
                  day: day.day,
                  time: item.time,
                  title: item.title,
                  requiresCheckIn: item.requiresCheckIn,
                  checkInCount: item.checkInCount || 0,
                  isParallel: true,
                });
              }
            });
          }
        });
      }

      console.log("📋 Processed agenda events:", events);
      setAgendaEvents(events);
    } catch (error) {
      console.error("❌ Error fetching agenda events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      console.log("📈 Fetching analytics data...");

      const response = await checkInsAPI.getCheckInsAnalytics();
      console.log("📊 Analytics API response:", response);
      console.log("📈 Analytics data:", response.data);

      setAnalytics(response.data);
    } catch (error) {
      console.error("❌ Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    console.log("🚀 CheckIns component mounted, fetching agenda events...");
    fetchAgendaEvents();
  }, [dayFilter]);

  useEffect(() => {
    console.log("📊 CheckIns component mounted, fetching analytics...");
    fetchAnalytics();
  }, []);

  // Log state changes
  useEffect(() => {
    console.log("🔄 Agenda events state updated:", {
      eventsCount: agendaEvents.length,
      loading,
      analytics: analytics ? "loaded" : "not loaded",
      analyticsLoading,
    });
  }, [agendaEvents, loading, analytics, analyticsLoading]);

  const filteredEvents = agendaEvents.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDay = !dayFilter || event.day === dayFilter;
    return matchesSearch && matchesDay;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDayOptions = () => {
    const days = [...new Set(agendaEvents.map((event) => event.day))];
    return days.sort();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Check-ins</h1>
        <Button
          onClick={fetchAnalytics}
          disabled={analyticsLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {analyticsLoading ? "Loading..." : "View Analytics"}
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Check-ins
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.checkInStats[0]?.totalCheckIns || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.checkInStats[0]?.uniqueUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.totalUniqueUsers}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by event title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Days</option>
                {getDayOptions().map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Events with Check-in Counts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Agenda Events & Check-in Counts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading agenda events...</div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No events found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {event.title}
                        {event.isParallel && (
                          <Badge variant="secondary" className="text-xs">
                            Parallel
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.day} • {event.time}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {event.checkInCount}
                    </div>
                    <div className="text-xs text-gray-500">Check-ins</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {filteredEvents.length} of {agendaEvents.length} events
              {dayFilter && ` on ${dayFilter}`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
