import { Heart, Calendar, TrendingUp, Bell, ChevronRight, Sparkles, Baby, Users, Star, Shield, Briefcase } from "lucide-react";
import Link from "next/link";
import { Card } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Button } from "../../components/ui/button";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { ThemeToggle } from "../../components/theme/theme-toggle";
import AppShell from "../../components/layout/app-shell";

export default function HomePage() {
  const weekNumber = 24;
  const progressPercentage = (weekNumber / 40) * 100;
  const daysUntilDueDate = 112;

  const upcomingTasks = [
    { id: 1, title: "Doctor Appointment", date: "March 25, 2026", time: "10:00 AM", type: "appointment" },
    { id: 2, title: "Take Prenatal Vitamins", date: "Daily", time: "8:00 AM", type: "medication" },
    { id: 3, title: "Yoga Class", date: "March 26, 2026", time: "6:00 PM", type: "activity" },
  ];

  const quickActions = [
    { icon: Heart, label: "Baby Kicks", color: "bg-primary/10 text-primary", link: "/pregnancy" },
    { icon: Calendar, label: "Book Appointment", color: "bg-secondary/10 text-secondary", link: "/appointments" },
    { icon: Sparkles, label: "Recovery Tips", color: "bg-accent/30 text-accent-foreground", link: "/postpartum" },
    { icon: Baby, label: "Baby Care", color: "bg-chart-4/20 text-chart-4", link: "/childcare" },
  ];

  return (
    <AppShell>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 px-4 md:px-8 pt-8 pb-24 rounded-b-[3rem]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl mb-1">Welcome back, Sarah!</h1>
              <p className="text-sm md:text-base text-muted-foreground">How are you feeling today?</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Pregnancy Progress Card */}
          <Card className="bg-card shadow-lg border-none rounded-3xl p-6 -mb-16">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-primary/10">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1664312550457-7573b60ee093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVnbmFudCUyMHdvbWFuJTIwc21pbGluZyUyMGhhcHB5fGVufDF8fHx8MTc3NDI5MjkzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Pregnancy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="mb-1">Your Journey</h3>
                <p className="text-sm text-muted-foreground mb-3">Week {weekNumber} of 40</p>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{daysUntilDueDate} days until due date</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <div className="flex-1 bg-accent/20 rounded-2xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Baby Size</p>
                <p className="text-base">🌽 Corn</p>
              </div>
              <div className="flex-1 bg-secondary/10 rounded-2xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Weight Gain</p>
                <p className="text-base">12 lbs</p>
              </div>
              <div className="flex-1 bg-primary/10 rounded-2xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Trimester</p>
                <p className="text-base">2nd</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-20">
        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.link}>
                  <Card className={`${action.color} border-none rounded-2xl p-4 hover:scale-105 transition-transform cursor-pointer`}>
                    <Icon className="w-6 h-6 mb-2" />
                    <p className="text-sm">{action.label}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Today's Tasks */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2>Today's Tasks</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingTasks.map((task) => (
              <Card key={task.id} className="border-none rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${
                      task.type === 'appointment' ? 'bg-primary/10 text-primary' :
                      task.type === 'medication' ? 'bg-secondary/10 text-secondary' :
                      'bg-accent/20 text-accent-foreground'
                    } flex items-center justify-center flex-shrink-0`}>
                      {task.type === 'appointment' ? <Calendar className="w-5 h-5" /> :
                       task.type === 'medication' ? <Heart className="w-5 h-5" /> :
                       <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="mb-1">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.date} • {task.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Tips for the Day */}
        <section className="mb-8">
          <h2 className="mb-4">Daily Wellness Tip</h2>
          <Card className="border-none rounded-3xl overflow-hidden shadow-md">
            <div className="h-48 bg-gradient-to-br from-accent/30 to-secondary/20 relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1561742139-4b0210a1894d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVnbmFuY3klMjB5b2dhJTIwd2VsbG5lc3N8ZW58MXx8fHwxNzc0MjkyOTM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Wellness"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5">
              <h3 className="mb-2">Stay Active with Prenatal Yoga</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gentle stretching helps reduce back pain and improves circulation. Try 15 minutes of prenatal yoga today!
              </p>
              <Button className="w-full rounded-full bg-primary hover:bg-primary/90">
                Start Session
              </Button>
            </div>
          </Card>
        </section>

        {/* Community Highlight */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2>From the Community</h2>
            <Link href="/community">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </Link>
          </div>
          <Card className="border-none rounded-3xl overflow-hidden shadow-md bg-gradient-to-br from-chart-5/20 to-primary/10">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-chart-5/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1">Join Our Community</h3>
                  <p className="text-sm text-muted-foreground">15.2K moms sharing their journey</p>
                </div>
              </div>
              <p className="text-sm mb-4">
                Connect with other mothers, share experiences, get advice, and celebrate milestones together. You're not alone in this journey!
              </p>
              <Link href="/community">
                <Button className="w-full rounded-full bg-chart-5 hover:bg-chart-5/90 text-foreground gap-2">
                  <Users className="w-4 h-4" />
                  Explore Community
                </Button>
              </Link>
            </div>
          </Card>
        </section>

        {/* New Features Grid */}
        <section className="mb-8">
          <h2 className="mb-4">Support & Wellness</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/affirmations">
              <Card className="border-none rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <h3>Daily Affirmations</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Beautiful reminders of your strength and worth as a mother
                </p>
              </Card>
            </Link>

            <Link href="/trusted-help">
              <Card className="border-none rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-secondary/10 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-secondary" />
                  </div>
                  <h3>Trusted Help</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Nanny checklist, chef instructions & baby food guides
                </p>
              </Card>
            </Link>

            <Link href="/career">
              <Card className="border-none rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-chart-5/20 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-chart-5/30 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-foreground" />
                  </div>
                  <h3>Career Return</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plan your return to work with supportive guidance
                </p>
              </Card>
            </Link>

            <Link href="/recovery">
              <Card className="border-none rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-accent/20 to-transparent">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h3>Body Recovery</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gentle exercises to rebuild strength postpartum
                </p>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
    </AppShell>
  );
}