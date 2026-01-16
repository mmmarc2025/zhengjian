import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { ArrowLeft, User, Shield, Bell, LogOut, Settings as SettingsIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // 如果未登入，重導向到登入頁面
  if (!loading && !user) {
    window.location.href = "/login?returnUrl=/settings";
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/trpc/auth.logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - White background */}
      <div className="border-b border-gray-100 bg-white/95 backdrop-blur shadow-sm">
        <div className="container flex items-center gap-4 h-16">
          <Button variant="ghost" size="sm" asChild style={{ color: '#0A2342' }}>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回首頁
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" style={{ color: '#A81C31' }} />
            <h1 className="text-lg font-semibold" style={{ color: '#0A2342' }}>設定</h1>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-2xl">
        {/* 個人資料 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              個人資料
            </CardTitle>
            <CardDescription>您的帳戶基本資訊</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">名稱</span>
              <span className="font-medium">{user?.name || "未設定"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">電子郵件</span>
              <span className="font-medium">{user?.email || "未設定"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">登入方式</span>
              <Badge variant="secondary">
                {user?.loginMethod === "line" ? "LINE" : 
                 user?.loginMethod === "google" ? "Google" : 
                 user?.loginMethod || "未知"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">帳戶角色</span>
              <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                {user?.role === "admin" ? "管理員" : "一般用戶"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 帳戶安全 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              帳戶安全
            </CardTitle>
            <CardDescription>管理您的帳戶安全設定</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">登出帳戶</p>
                <p className="text-sm text-muted-foreground">從此裝置登出您的帳戶</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                登出
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              通知設定
            </CardTitle>
            <CardDescription>管理您的通知偏好</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              通知功能即將推出，敬請期待！
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
