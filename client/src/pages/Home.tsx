import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Search, Users, FileText, MessageSquare, 
  ChevronRight, MapPin, Building2, Vote,
  ArrowRight, Newspaper, TrendingUp
} from "lucide-react";
import { useState } from "react";
import { COUNTIES, PARTIES, POSITION_TYPES } from "@shared/constants";
import { getLineLoginUrl } from "@/const";

export default function Home() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: stats } = trpc.stats.get.useQuery();
  const { data: latestNews } = trpc.news.list.useQuery({ limit: 3 });
  const { data: featuredCandidates } = trpc.candidate.list.useQuery({ 
    positionType: "mayor",
    limit: 6 
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/candidates?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Vote className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">政見</span>
            <span className="text-sm text-muted-foreground ml-1">political.now</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/candidates" className="text-muted-foreground hover:text-foreground transition-colors">
              候選人
            </Link>
            <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors">
              最新動態
            </Link>
            <Link href="/compare" className="text-muted-foreground hover:text-foreground transition-colors">
              政見比較
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                管理後台
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.name || "使用者"}
                </span>
                {user.role === "admin" && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    管理員
                  </Badge>
                )}
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild className="bg-[#00B900] hover:bg-[#00A000] text-white border-[#00B900]">
                <a href={getLineLoginUrl()}>LINE 登入</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }}
        />

        <div className="container relative z-10 text-center">
          <Badge variant="secondary" className="mb-6 bg-primary/20 text-primary border-primary/30">
            2026 九合一地方選舉
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            <span className="gradient-text">政見</span>
            <span className="text-foreground"> political.now</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            全台灣最完整的候選人政見資料庫
            <br />
            <span className="text-foreground font-medium">查詢、比較、參與討論</span>
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜尋候選人姓名、選區或政黨..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 text-lg bg-card border-border rounded-full"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
              >
                搜尋
              </Button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {stats?.totalCandidates || 0}
              </div>
              <div className="text-sm text-muted-foreground">候選人</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-accent">
                {stats?.totalPolicies || 0}
              </div>
              <div className="text-sm text-muted-foreground">政見</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-chart-3">
                {stats?.totalComments || 0}
              </div>
              <div className="text-sm text-muted-foreground">討論</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-muted-foreground rotate-90" />
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-20 bg-card/50">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8 text-center">快速查詢</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* By Region */}
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  依縣市查詢
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {COUNTIES.slice(0, 8).map((county) => (
                    <Link key={county.id} href={`/candidates?county=${county.name}`}>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary/20 hover:border-primary transition-colors"
                      >
                        {county.name}
                      </Badge>
                    </Link>
                  ))}
                  <Link href="/candidates">
                    <Badge variant="secondary" className="cursor-pointer">
                      更多 <ArrowRight className="w-3 h-3 ml-1" />
                    </Badge>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* By Party */}
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-accent" />
                  依政黨查詢
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PARTIES.slice(0, 6).map((party) => (
                    <Link key={party.id} href={`/candidates?party=${party.name}`}>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent/20 hover:border-accent transition-colors"
                        style={{ borderColor: party.color + "50" }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: party.color }}
                        />
                        {party.shortName}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* By Position */}
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-chart-3" />
                  依職位查詢
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {POSITION_TYPES.map((position) => (
                    <Link key={position.id} href={`/candidates?position=${position.id}`}>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-chart-3/20 hover:border-chart-3 transition-colors"
                      >
                        {position.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Candidates */}
      {featuredCandidates && featuredCandidates.length > 0 && (
        <section className="py-20">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">縣市長候選人</h2>
              <Link href="/candidates?position=mayor">
                <Button variant="ghost" className="gap-2">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCandidates.map((candidate) => (
                <Link key={candidate.id} href={`/candidate/${candidate.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground overflow-hidden">
                          {candidate.photoUrl ? (
                            <img 
                              src={candidate.photoUrl} 
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            candidate.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold mb-1">{candidate.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            {candidate.party && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: PARTIES.find(p => p.name === candidate.party)?.color + "20",
                                  color: PARTIES.find(p => p.name === candidate.party)?.color
                                }}
                              >
                                {candidate.party}
                              </Badge>
                            )}
                            {candidate.isIncumbent && (
                              <Badge variant="outline" className="text-xs">現任</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {candidate.county} {candidate.district || ""}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest News */}
      {latestNews && latestNews.length > 0 && (
        <section className="py-20 bg-card/50">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Newspaper className="w-8 h-8 text-primary" />
                最新動態
              </h2>
              <Link href="/news">
                <Button variant="ghost" className="gap-2">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {latestNews.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer h-full">
                    {item.imageUrl && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-2 line-clamp-2">{item.title}</h3>
                      {item.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {item.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{item.sourceName || "政見編輯部"}</span>
                        <span>{new Date(item.publishedAt).toLocaleDateString("zh-TW")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                比較候選人政見
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                選擇同選區的候選人，並排比較他們的政見差異，做出最明智的投票決定
              </p>
              <Link href="/compare">
                <Button size="lg" className="gap-2">
                  <TrendingUp className="w-5 h-5" />
                  開始比較
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Vote className="w-6 h-6 text-primary" />
              <span className="font-bold">政見 political.now</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              2026 台灣九合一地方選舉候選人資訊平台
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">
                關於我們
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                隱私政策
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
