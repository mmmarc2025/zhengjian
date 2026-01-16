import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Search, Users, FileText, MessageSquare, 
  ChevronRight, MapPin, Building2, Vote,
  ArrowRight, Newspaper, TrendingUp, LogOut, Settings,
  Clock, ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { COUNTIES, PARTIES, POSITION_TYPES } from "@shared/constants";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const logoutMutation = trpc.auth.logout.useMutation();
  
  useEffect(() => {
    document.title = "政見 political.now - 2026 台灣九合一選舉候選人政見查詢平台";
  }, []);
  
  const { data: stats } = trpc.stats.get.useQuery();
  const { data: latestNews } = trpc.news.list.useQuery({ limit: 4 });
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
      {/* Modern Navigation - White background */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Vote className="w-7 h-7" style={{ color: '#A81C31' }} />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold" style={{ color: '#A81C31' }}>政見</span>
              <span className="text-sm" style={{ color: '#0A2342' }}>political.now</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/candidates" className="font-medium transition-colors" style={{ color: '#0A2342' }}>
              候選人
            </Link>
            <Link href="/news" className="font-medium transition-colors" style={{ color: '#0A2342' }}>
              最新動態
            </Link>
            <Link href="/compare" className="font-medium transition-colors" style={{ color: '#0A2342' }}>
              政見比較
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="font-medium transition-colors" style={{ color: '#0A2342' }}>
                管理後台
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover:bg-gray-100"
              style={{ color: '#0A2342' }}
              onClick={() => document.getElementById('search-input')?.focus()}
            >
              <Search className="w-5 h-5" />
            </Button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-gray-100 flex items-center gap-2" style={{ color: '#0A2342' }}>
                    <span className="text-sm hidden sm:inline">
                      {user.name || "使用者"}
                    </span>
                    {user.role === "admin" && (
                      <Badge className="text-xs text-white" style={{ backgroundColor: '#A81C31' }}>
                        管理員
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      設定
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => {
                      logoutMutation.mutate(undefined, {
                        onSuccess: () => {
                          window.location.href = '/';
                        },
                      });
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button className="btn-accent" size="sm" asChild>
                <Link href="/login">登入</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - White background with Navy/Crimson accents */}
      <section className="pt-16 min-h-[85vh] flex items-center relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="container relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-8 px-4 py-2 text-sm font-semibold border" style={{ backgroundColor: '#A81C31', color: 'white', borderColor: '#A81C31' }}>
              2026 九合一地方選舉
            </Badge>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 tracking-tight leading-none">
              <span style={{ color: '#A81C31' }}>政見</span>
              <span style={{ color: '#0A2342' }}> political.now</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#4a5568' }}>
              全台灣最完整的候選人政見資料庫
              <br />
              <span className="font-semibold" style={{ color: '#0A2342' }}>查詢、比較、參與討論</span>
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="search-input"
                  type="text"
                  placeholder="搜尋候選人姓名、選區或政黨..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-32 h-16 text-lg bg-white text-foreground rounded-full border-0 shadow-xl focus:ring-4 focus:ring-teal/30"
                />
                <Button 
                  type="submit" 
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-12 px-8 btn-accent"
                >
                  搜尋
                </Button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#A81C31' }}>
                  {stats?.totalCandidates || 0}
                </div>
                <div className="text-sm uppercase tracking-wide" style={{ color: '#718096' }}>候選人</div>
              </div>
              <div className="text-center border-x" style={{ borderColor: '#e2e8f0' }}>
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#0A2342' }}>
                  {stats?.totalPolicies || 0}
                </div>
                <div className="text-sm uppercase tracking-wide" style={{ color: '#718096' }}>政見</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: '#A81C31' }}>
                  {stats?.totalComments || 0}
                </div>
                <div className="text-sm uppercase tracking-wide" style={{ color: '#718096' }}>討論</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-8 h-8 text-crimson rotate-90" />
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">快速查詢</h2>
            <p className="text-lg text-muted-foreground">選擇您感興趣的方式開始探索</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* By Region */}
            <Card className="news-card group border-0">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-navy/10 flex items-center justify-center mb-6 group-hover:bg-navy/20 transition-colors">
                  <MapPin className="w-7 h-7 text-navy" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">依縣市查詢</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {COUNTIES.slice(0, 6).map((county) => (
                    <Link key={county.id} href={`/candidates?county=${county.name}`}>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-navy hover:text-white hover:border-navy transition-all"
                      >
                        {county.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <Link href="/candidates" className="inline-flex items-center text-navy font-semibold hover:text-crimson transition-colors">
                  查看全部縣市 <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </CardContent>
            </Card>

            {/* By Party */}
            <Card className="news-card group border-0">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-crimson/10 flex items-center justify-center mb-6 group-hover:bg-crimson/20 transition-colors">
                  <Building2 className="w-7 h-7 text-crimson" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">依政黨查詢</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {PARTIES.slice(0, 5).map((party) => (
                    <Link key={party.id} href={`/candidates?party=${party.name}`}>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:text-white transition-all"
                        style={{ 
                          borderColor: party.color,
                          '--hover-bg': party.color 
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = party.color;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '';
                        }}
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
                <Link href="/candidates" className="inline-flex items-center text-crimson font-semibolhover:text-crimsonvy transition-colors">
                  查看全部政黨 <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </CardContent>
            </Card>

            {/* By Position */}
            <Card className="news-card group border-0">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:bg-destructive/20 transition-colors">
                  <Users className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-foreground">依職位查詢</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {POSITION_TYPES.slice(0, 4).map((position) => (
                    <Link key={position.id} href={`/candidates?position=${position.id}`}>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                      >
                        {position.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <Link href="/candidates" className="inline-flex items-center text-destructive font-semibold hover:text-navy transition-colors">
                  查看全部職位 <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Candidates - Asymmetric Grid */}
      {featuredCandidates && featuredCandidates.length > 0 && (
        <section className="py-24 bg-secondary/30">
          <div className="container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <Badge className="mb-4 bg-navy/10 text-navy">焦點人物</Badge>
                <h2 className="text-4xl font-bold text-foreground">縣市長候選人</h2>
              </div>
              <Link href="/candidates?position=mayor">
                <Button variant="outline" className="gap-2 border-navy text-navy hover:bg-navy hover:text-white">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCandidates.map((candidate, index) => (
                <Link key={candidate.id} href={`/candidate/${candidate.id}`}>
                  <Card className={`news-card border-0 cursor-pointer h-full ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-navy/20 to-teal/20 flex items-center justify-center text-3xl font-bold text-navy overflow-hidden flex-shrink-0">
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
                          <h3 className="text-xl font-bold mb-2 text-foreground">{candidate.name}</h3>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {candidate.party && (
                              <Badge 
                                className="text-xs font-medium"
                                style={{ 
                                  backgroundColor: (PARTIES.find(p => p.name === candidate.party)?.color || '#666') + "20",
                                  color: PARTIES.find(p => p.name === candidate.party)?.color || '#666'
                                }}
                              >
                                {candidate.party}
                              </Badge>
                            )}
                            {candidate.isIncumbent && (
                              <Badge variant="outline" className="text-xs border-crimson text-crimson">現任</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
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

      {/* Latest News - Card Layout */}
      {latestNews && latestNews.length > 0 && (
        <section className="py-24 bg-background">
          <div className="container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <Badge className="mb-4 bg-destructive/10 text-destructive">即時更新</Badge>
                <h2 className="text-4xl font-bold text-foreground flex items-center gap-3">
                  <Newspaper className="w-10 h-10 text-navy" />
                  最新動態
                </h2>
              </div>
              <Link href="/news">
                <Button variant="outline" className="gap-2 border-navy text-navy hover:bg-navy hover:text-white">
                  查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Asymmetric News Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Featured News - Large */}
              {latestNews[0] && (
                <a href={latestNews[0].sourceUrl || `/news/${latestNews[0].id}`} target={latestNews[0].sourceUrl ? "_blank" : "_self"} rel="noopener noreferrer" className="lg:col-span-2">
                  <Card className="news-card border-0 cursor-pointer h-full overflow-hidden">
                    <div className="aspect-[16/9] lg:aspect-[21/9] overflow-hidden bg-gradient-to-br from-navy/10 to-teal/10">
                      {latestNews[0].imageUrl ? (
                        <img 
                          src={latestNews[0].imageUrl} 
                          alt={latestNews[0].title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-16 h-16 text-navy/30" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <Badge className="mb-3 bg-destructive/10 text-destructive text-xs">頭條</Badge>
                      <h3 className="text-2xl font-bold mb-3 line-clamp-2 text-foreground">{latestNews[0].title}</h3>
                      {latestNews[0].summary && (
                        <p className="text-muted-foreground line-clamp-2 mb-4">
                          {latestNews[0].summary}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(latestNews[0].publishedAt).toLocaleDateString("zh-TW")}
                        </span>
                        <span>{latestNews[0].sourceName || "政見編輯部"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              )}

              {/* Side News - Stacked */}
              <div className="flex flex-col gap-6">
                {latestNews.slice(1, 4).map((item) => (
                  <a key={item.id} href={item.sourceUrl || `/news/${item.id}`} target={item.sourceUrl ? "_blank" : "_self"} rel="noopener noreferrer">
                    <Card className="news-card border-0 cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex gap-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-navy/10 to-teal/10 flex-shrink-0">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Newspaper className="w-8 h-8 text-navy/30" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold mb-2 line-clamp-2 text-foreground">{item.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(item.publishedAt).toLocaleDateString("zh-TW")}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer - Light background */}
      <footer className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Vote className="w-8 h-8" style={{ color: '#A81C31' }} />
                <span className="text-2xl font-bold" style={{ color: '#0A2342' }}>政見 political.now</span>
              </div>
              <p className="max-w-md leading-relaxed" style={{ color: '#718096' }}>
                2026 台灣九合一地方選舉候選人資訊平台。我們致力於提供最完整、最透明的選舉資訊，幫助選民做出明智的投票決定。
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#A81C31' }}>快速連結</h4>
              <div className="flex flex-col gap-2">
                <Link href="/candidates" className="transition-colors hover:opacity-70" style={{ color: '#4a5568' }}>候選人</Link>
                <Link href="/news" className="transition-colors hover:opacity-70" style={{ color: '#4a5568' }}>最新動態</Link>
                <Link href="/compare" className="transition-colors hover:opacity-70" style={{ color: '#4a5568' }}>政見比較</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4" style={{ color: '#A81C31' }}>關於</h4>
              <div className="flex flex-col gap-2">
                <Link href="/about" className="transition-colors hover:opacity-70" style={{ color: '#4a5568' }}>關於我們</Link>
                <Link href="/privacy" className="transition-colors hover:opacity-70" style={{ color: '#4a5568' }}>隱私政策</Link>
                <Link href="/terms" className="transition-colors hover:opacity-70" style={{ color: '#4a5568' }}>使用條款</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm" style={{ borderColor: '#e2e8f0', color: '#a0aec0' }}>
            © 2026 政見 political.now. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
