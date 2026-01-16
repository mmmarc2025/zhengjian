import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { Search, Vote, Filter, X, Users, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { COUNTIES, PARTIES, POSITION_TYPES } from "@shared/constants";

export default function Candidates() {
  const searchParams = new URLSearchParams(window.location.search);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [county, setCounty] = useState(searchParams.get("county") || "all");
  const [party, setParty] = useState(searchParams.get("party") || "all");
  const [position, setPosition] = useState(searchParams.get("position") || "all");

  const { data: candidates, isLoading } = trpc.candidate.list.useQuery({
    search: search || undefined,
    county: county !== "all" ? county : undefined,
    party: party !== "all" ? party : undefined,
    positionType: position !== "all" ? position : undefined,
    limit: 100,
  });

  const clearFilters = () => {
    setSearch("");
    setCounty("all");
    setParty("all");
    setPosition("all");
  };

  const hasFilters = search || county !== "all" || party !== "all" || position !== "all";

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - White background */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Vote className="w-8 h-8" style={{ color: '#A81C31' }} />
            <span className="text-xl font-bold" style={{ color: '#A81C31' }}>政見</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/candidates" className="font-medium" style={{ color: '#A81C31' }}>
              候選人
            </Link>
            <Link href="/news" className="transition-colors hover:opacity-70" style={{ color: '#0A2342' }}>
              最新動態
            </Link>
            <Link href="/compare" className="transition-colors hover:opacity-70" style={{ color: '#0A2342' }}>
              政見比較
            </Link>
          </div>
          <ThemeSwitcher />
        </div>
      </nav>

      <main className="pt-24 pb-12">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4 -ml-2" style={{ color: '#0A2342' }}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                返回首頁
              </Button>
            </Link>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#0A2342' }}>候選人資料庫</h1>
            <p style={{ color: '#718096' }}>
              2026 九合一選舉全台候選人政見查詢
            </p>
          </div>

          {/* Filters */}
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">篩選條件</span>
                {hasFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="ml-auto text-muted-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    清除篩選
                  </Button>
                )}
              </div>
              
              <div className="grid md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋姓名..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-input"
                  />
                </div>

                {/* County */}
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="選擇縣市" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部縣市</SelectItem>
                    {COUNTIES.map((c) => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Party */}
                <Select value={party} onValueChange={setParty}>
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="選擇政黨" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部政黨</SelectItem>
                    {PARTIES.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        <span className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Position */}
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder="選擇職位" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部職位</SelectItem>
                    {POSITION_TYPES.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted" />
                      <div className="flex-1">
                        <div className="h-5 bg-muted rounded w-24 mb-2" />
                        <div className="h-4 bg-muted rounded w-32 mb-2" />
                        <div className="h-3 bg-muted rounded w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : candidates && candidates.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground">
                  共找到 <span className="text-foreground font-medium">{candidates.length}</span> 位候選人
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((candidate) => (
                  <Link key={candidate.id} href={`/candidate/${candidate.id}`}>
                    <Card className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground overflow-hidden flex-shrink-0">
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
                            <div className="flex flex-wrap items-center gap-2 mb-2">
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
                              <Badge variant="outline" className="text-xs">
                                {POSITION_TYPES.find(p => p.id === candidate.positionType)?.name || candidate.positionType}
                              </Badge>
                              {candidate.isIncumbent && (
                                <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                                  現任
                                </Badge>
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
            </>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">尚無候選人資料</h3>
                <p className="text-muted-foreground mb-4">
                  {hasFilters 
                    ? "找不到符合條件的候選人，請嘗試調整篩選條件"
                    : "目前資料庫中尚無候選人資料，請稍後再試"
                  }
                </p>
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    清除篩選條件
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
