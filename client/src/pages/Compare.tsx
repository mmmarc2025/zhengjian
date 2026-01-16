import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Vote, ChevronLeft, TrendingUp, Plus, X, Users, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { COUNTIES, PARTIES, POSITION_TYPES, ISSUE_CATEGORIES } from "@shared/constants";

export default function Compare() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialIds = searchParams.get("ids")?.split(",").map(Number).filter(Boolean) || [];
  
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const [county, setCounty] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");

  // Fetch all candidates for selection
  const { data: allCandidates } = trpc.candidate.list.useQuery({
    county: county !== "all" ? county : undefined,
    positionType: position !== "all" ? position : undefined,
    limit: 100,
  });

  // Fetch comparison data
  const { data: comparisonData, isLoading } = trpc.candidate.compare.useQuery(
    { ids: selectedIds },
    { enabled: selectedIds.length >= 2 }
  );

  const availableCandidates = useMemo(() => {
    return allCandidates?.filter(c => !selectedIds.includes(c.id)) || [];
  }, [allCandidates, selectedIds]);

  const addCandidate = (id: number) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeCandidate = (id: number) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  // Group policies by category for comparison
  const policiesByCategory = useMemo(() => {
    if (!comparisonData) return {};
    
    const result: Record<string, Record<number, typeof comparisonData.policiesMap[number]>> = {};
    
    ISSUE_CATEGORIES.forEach(cat => {
      result[cat.id] = {};
      comparisonData.candidates.forEach(candidate => {
        const policies = comparisonData.policiesMap[candidate.id]?.filter(
          p => p.categoryId?.toString() === cat.id
        ) || [];
        if (policies.length > 0) {
          result[cat.id][candidate.id] = policies;
        }
      });
    });
    
    return result;
  }, [comparisonData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Vote className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">政見</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/candidates" className="text-muted-foreground hover:text-foreground transition-colors">
              候選人
            </Link>
            <Link href="/news" className="text-muted-foreground hover:text-foreground transition-colors">
              最新動態
            </Link>
            <Link href="/compare" className="text-foreground font-medium">
              政見比較
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4 -ml-2">
                <ChevronLeft className="w-4 h-4 mr-1" />
                返回首頁
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold">政見比較</h1>
            </div>
            <p className="text-muted-foreground">
              選擇 2-4 位候選人，並排比較他們的政見差異
            </p>
          </div>

          {/* Selection Panel */}
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle className="text-lg">選擇候選人</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
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

                <Select 
                  value="" 
                  onValueChange={(v) => addCandidate(parseInt(v))}
                  disabled={selectedIds.length >= 4}
                >
                  <SelectTrigger className="bg-input">
                    <SelectValue placeholder={selectedIds.length >= 4 ? "已達上限" : "新增候選人"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCandidates.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} ({c.county} - {c.party || "無黨籍"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Candidates */}
              <div className="flex flex-wrap gap-3">
                {selectedIds.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    請選擇至少 2 位候選人進行比較
                  </p>
                ) : (
                  selectedIds.map((id) => {
                    const candidate = allCandidates?.find(c => c.id === id) || 
                                     comparisonData?.candidates.find(c => c.id === id);
                    if (!candidate) return null;
                    
                    const partyInfo = PARTIES.find(p => p.name === candidate.party);
                    
                    return (
                      <Badge 
                        key={id}
                        variant="secondary"
                        className="pl-3 pr-1 py-1.5 text-sm"
                        style={{
                          backgroundColor: partyInfo?.color + "20",
                          borderColor: partyInfo?.color + "50"
                        }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: partyInfo?.color || "#808080" }}
                        />
                        {candidate.name}
                        <button
                          onClick={() => removeCandidate(id)}
                          className="ml-2 p-1 hover:bg-background/50 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comparison Results */}
          {selectedIds.length < 2 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">請選擇候選人</h3>
                <p className="text-muted-foreground">
                  選擇至少 2 位候選人即可開始比較政見
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-card border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded w-32 mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 bg-muted rounded" />
                      <div className="h-24 bg-muted rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : comparisonData ? (
            <div className="space-y-6">
              {/* Candidate Headers */}
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparisonData.candidates.length}, 1fr)` }}>
                {comparisonData.candidates.map((candidate) => {
                  const partyInfo = PARTIES.find(p => p.name === candidate.party);
                  return (
                    <Card key={candidate.id} className="bg-card border-border">
                      <CardContent className="p-4 text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground overflow-hidden mb-3">
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
                        <h3 className="font-bold mb-1">{candidate.name}</h3>
                        {candidate.party && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: partyInfo?.color + "20",
                              color: partyInfo?.color
                            }}
                          >
                            {candidate.party}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {candidate.county}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Policies by Category */}
              {ISSUE_CATEGORIES.map((category) => {
                const categoryPolicies = policiesByCategory[category.id];
                const hasAnyPolicies = Object.keys(categoryPolicies || {}).length > 0;
                
                if (!hasAnyPolicies) return null;
                
                return (
                  <Card key={category.id} className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Badge variant="outline">{category.name}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="grid gap-4" 
                        style={{ gridTemplateColumns: `repeat(${comparisonData.candidates.length}, 1fr)` }}
                      >
                        {comparisonData.candidates.map((candidate) => {
                          const policies = categoryPolicies?.[candidate.id] || [];
                          return (
                            <div key={candidate.id} className="space-y-2">
                              {policies.length > 0 ? (
                                policies.map((policy) => (
                                  <div 
                                    key={policy.id} 
                                    className="p-3 bg-muted/50 rounded-lg"
                                  >
                                    <h4 className="font-medium text-sm mb-1">{policy.title}</h4>
                                    {policy.summary && (
                                      <p className="text-xs text-muted-foreground">
                                        {policy.summary}
                                      </p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 bg-muted/30 rounded-lg text-center">
                                  <p className="text-xs text-muted-foreground">
                                    尚無相關政見
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* No policies at all */}
              {Object.values(policiesByCategory).every(cat => Object.keys(cat).length === 0) && (
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">尚無政見資料</h3>
                    <p className="text-muted-foreground">
                      所選候選人目前尚無政見資料可供比較
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
