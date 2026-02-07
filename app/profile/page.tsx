import React from "react";
import { Trophy, Target, Zap, Clock, Users, Award } from "lucide-react";

const ProfilePage = () => {
  // Mock user data
  const user = {
    name: "Roshan Shakya",
    email: "roshan.shakyaa2015@gmail.com",
    joinDate: "January 15, 2026",
  };

  // Mock stats
  const stats = {
    bestWpm: 127,
    avgWpm: 98,
    avgAccuracy: 96,
    totalTests: 156,
    totalRaces: 42,
    racesWon: 18,
  };

  // Mock recent typing tests
  const recentTests = [
    {
      id: 1,
      wpm: 127,
      rawWpm: 135,
      accuracy: 98,
      consistency: 94,
      errors: 12,
      mode: "time",
      duration: 60,
      date: "2026-02-07T14:30:00",
    },
    {
      id: 2,
      wpm: 105,
      rawWpm: 112,
      accuracy: 97,
      consistency: 91,
      errors: 8,
      mode: "words",
      duration: 50,
      date: "2026-02-07T10:15:00",
    },
    {
      id: 3,
      wpm: 98,
      rawWpm: 104,
      accuracy: 95,
      consistency: 88,
      errors: 15,
      mode: "time",
      duration: 30,
      date: "2026-02-06T16:45:00",
    },
    {
      id: 4,
      wpm: 112,
      rawWpm: 118,
      accuracy: 96,
      consistency: 92,
      errors: 10,
      mode: "time",
      duration: 120,
      date: "2026-02-06T09:20:00",
    },
    {
      id: 5,
      wpm: 89,
      rawWpm: 95,
      accuracy: 94,
      consistency: 87,
      errors: 18,
      mode: "words",
      duration: 25,
      date: "2026-02-05T19:00:00",
    },
  ];

  // Mock recent races
  const recentRaces = [
    {
      id: 1,
      position: 1,
      totalPlayers: 4,
      wpm: 118,
      accuracy: 97,
      date: "2026-02-07T15:00:00",
      opponents: ["Alice", "Bob", "Charlie"],
    },
    {
      id: 2,
      position: 2,
      totalPlayers: 3,
      wpm: 102,
      accuracy: 95,
      date: "2026-02-07T12:30:00",
      opponents: ["Emma", "David"],
    },
    {
      id: 3,
      position: 3,
      totalPlayers: 5,
      wpm: 95,
      accuracy: 93,
      date: "2026-02-06T18:15:00",
      opponents: ["Frank", "Grace", "Henry", "Ivy"],
    },
    {
      id: 4,
      position: 1,
      totalPlayers: 2,
      wpm: 125,
      accuracy: 98,
      date: "2026-02-06T11:00:00",
      opponents: ["Jack"],
    },
    {
      id: 5,
      position: 2,
      totalPlayers: 4,
      wpm: 108,
      accuracy: 96,
      date: "2026-02-05T20:45:00",
      opponents: ["Kate", "Liam", "Mia"],
    },
  ];

  const getPositionColor = (position: number) => {
    switch (position) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-orange-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${position}`;
    }
  };

  return (
    <div className="flex-1 pt-12 max-w-6xl mx-auto px-4 pb-12">
      {/* Profile Header */}
      <div className="w-full rounded-lg p-6 border bg-background mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-20 md:size-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/20 flex items-center justify-center">
              <span className="text-3xl md:text-4xl font-bold text-primary">
                R
              </span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                Joined {user.joinDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          icon={<Trophy className="size-5" />}
          label="Best WPM"
          value={stats.bestWpm}
          color="text-yellow-500"
        />
        <StatCard
          icon={<Zap className="size-5" />}
          label="Avg WPM"
          value={stats.avgWpm}
          color="text-primary"
        />
        <StatCard
          icon={<Target className="size-5" />}
          label="Avg Accuracy"
          value={`${stats.avgAccuracy}%`}
          color="text-green-500"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Tests"
          value={stats.totalTests}
          color="text-blue-500"
        />
        <StatCard
          icon={<Users className="size-5" />}
          label="Races"
          value={stats.totalRaces}
          color="text-purple-500"
        />
        <StatCard
          icon={<Award className="size-5" />}
          label="Wins"
          value={stats.racesWon}
          color="text-orange-500"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tests */}
        <div className="w-full rounded-lg border bg-background p-6">
          <h2 className="text-xl font-bold mb-4">Recent Tests</h2>
          <div className="space-y-3">
            {recentTests.map((test, index) => (
              <div
                key={test.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">{test.wpm} WPM</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {test.accuracy}% acc
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {test.mode === "time"
                          ? `${test.duration}s`
                          : `${test.duration} words`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(test.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Raw</p>
                    <p className="font-semibold">{test.rawWpm}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Errors</p>
                    <p className="font-semibold">{test.errors}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Races */}
        <div className="w-full rounded-lg border bg-background p-6">
          <h2 className="text-xl font-bold mb-4">Recent Races</h2>
          <div className="space-y-3">
            {recentRaces.map((race) => (
              <div
                key={race.id}
                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-bold ${getPositionColor(race.position)}`}
                    >
                      {getPositionEmoji(race.position)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{race.wpm} WPM</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {race.accuracy}% acc
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {race.position}/{race.totalPlayers} place
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(race.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Users className="size-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    vs {race.opponents.join(", ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl md:text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default ProfilePage;
