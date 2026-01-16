import { useAuth } from "../_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link, useParams, useLocation } from "wouter";
import { 
  ChevronLeft, User, FileText, Newspaper, Pencil, Trash2, Plus,
  Sparkles, RefreshCw, ExternalLink, Save, Image
} from "lucide-react";
import { useState, useEffect } from "react";
import { COUNTIES, PARTIES, POSITION_TYPES, ISSUE_CATEGORIES } from "@shared/constants";
import { toast } from "sonner";

export default function AdminCandidateEdit() {
  const { user, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const candidateId = parseInt(params.id || "0");

  // Fetch candidate data
  const { data: candidate, refetch: refetchCandidate } = trpc.candidate.getById.useQuery(
    { id: candidateId },
    { enabled: candidateId > 0 }
  );
  const { data: policies, refetch: refetchPolicies } = trpc.policy.getByCandidateId.useQuery(
    { candidateId },
    { enabled: candidateId > 0 }
  );
  const { data: news, refetch: refetchNews } = trpc.candidateNews.getByCandidateId.useQuery(
    { candidateId },
    { enabled: candidateId > 0 }
  );
  const { data: categories } = trpc.category.list.useQuery();

  // Mutations
  const updateCandidate = trpc.candidate.update.useMutation({
    onSuccess: () => {
      refetchCandidate();
      toast.success("候選人資料已更新");
    },
    onError: (e) => toast.error(e.message),
  });

  const createPolicy = trpc.policy.create.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsPolicyDialogOpen(false);
      resetPolicyForm();
      toast.success("政見已新增");
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePolicy = trpc.policy.update.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsPolicyDialogOpen(false);
      setEditingPolicy(null);
      resetPolicyForm();
      toast.success("政見已更新");
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePolicy = trpc.policy.delete.useMutation({
    onSuccess: () => {
      refetchPolicies();
      toast.success("政見已刪除");
    },
    onError: (e) => toast.error(e.message),
  });

  const createNews = trpc.candidateNews.create.useMutation({
    onSuccess: () => {
      refetchNews();
      setIsNewsDialogOpen(false);
      resetNewsForm();
      toast.success("新聞已新增");
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteNews = trpc.candidateNews.delete.useMutation({
    onSuccess: () => {
      refetchNews();
      toast.success("新聞已刪除");
    },
    onError: (e) => toast.error(e.message),
  });

  // AI Search mutations
  const searchPolicies = trpc.ai.searchPolicies.useMutation({
    onSuccess: (data) => {
      refetchPolicies();
      toast.success(`已新增 ${data.policies.length} 條政見`);
    },
    onError: (e) => toast.error(`搜尋失敗: ${e.message}`),
  });

  const searchNews = trpc.ai.searchNews.useMutation({
    onSuccess: (data) => {
      if (data.news.length === 0) {
        toast.info("未找到相關新聞");
        return;
      }
      setNewsSearchResults(data.news);
      setIsNewsSearchDialogOpen(true);
      toast.success(`找到 ${data.news.length} 則新聞，請選擇要新增的新聞`);
    },
    onError: (e) => toast.error(`搜尋失敗: ${e.message}`),
  });

  type PositionType = "mayor" | "councilor" | "township_mayor" | "representative" | "village_chief";

  // State for candidate edit form
  const [candidateForm, setCandidateForm] = useState<{
    name: string;
    party: string;
    positionType: PositionType;
    county: string;
    district: string;
    age: string;
    education: string;
    experience: string;
    isIncumbent: boolean;
    photoUrl: string;
  }>({
    name: "",
    party: "",
    positionType: "mayor" as PositionType,
    county: "",
    district: "",
    age: "",
    education: "",
    experience: "",
    isIncumbent: false,
    photoUrl: "",
  });

  // State for policy dialog
  const [isPolicyDialogOpen, setIsPolicyDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyForm, setPolicyForm] = useState({
    categoryId: "",
    title: "",
    summary: "",
    content: "",
    source: "",
    isHighlight: false,
  });

  // State for news dialog
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: "",
    summary: "",
    sourceUrl: "",
    sourceName: "",
    imageUrl: "",
  });

  // State for news search results dialog
  const [isNewsSearchDialogOpen, setIsNewsSearchDialogOpen] = useState(false);
  const [newsSearchResults, setNewsSearchResults] = useState<Array<{
    title: string;
    sourceUrl: string;
    sourceName: string;
  }>>([]);

  // Initialize form when candidate data loads
  useEffect(() => {
    if (candidate) {
      setCandidateForm({
        name: candidate.name,
        party: candidate.party || "",
        positionType: candidate.positionType,
        county: candidate.county,
        district: candidate.district || "",
        age: candidate.age?.toString() || "",
        education: candidate.education || "",
        experience: candidate.experience || "",
        isIncumbent: candidate.isIncumbent || false,
        photoUrl: candidate.photoUrl || "",
      });
    }
  }, [candidate]);

  const resetPolicyForm = () => {
    setPolicyForm({
      categoryId: "",
      title: "",
      summary: "",
      content: "",
      source: "",
      isHighlight: false,
    });
  };

  const resetNewsForm = () => {
    setNewsForm({
      title: "",
      summary: "",
      sourceUrl: "",
      sourceName: "",
      imageUrl: "",
    });
  };

  const handleEditPolicy = (policy: any) => {
    setEditingPolicy(policy);
    setPolicyForm({
      categoryId: policy.categoryId?.toString() || "",
      title: policy.title,
      summary: policy.summary || "",
      content: policy.content || "",
      source: policy.source || "",
      isHighlight: policy.isHighlight || false,
    });
    setIsPolicyDialogOpen(true);
  };

  const handleSaveCandidate = () => {
    updateCandidate.mutate({
      id: candidateId,
      ...candidateForm,
      age: candidateForm.age ? parseInt(candidateForm.age) : undefined,
    });
  };

  const handleSubmitPolicy = () => {
    const data = {
      candidateId,
      categoryId: policyForm.categoryId ? parseInt(policyForm.categoryId) : undefined,
      title: policyForm.title,
      summary: policyForm.summary || undefined,
      content: policyForm.content || undefined,
      source: policyForm.source || undefined,
      isHighlight: policyForm.isHighlight,
    };

    if (editingPolicy) {
      updatePolicy.mutate({ id: editingPolicy.id, ...data });
    } else {
      createPolicy.mutate(data);
    }
  };

  const handleSubmitNews = () => {
    createNews.mutate({
      candidateId,
      title: newsForm.title,
      summary: newsForm.summary || undefined,
      sourceUrl: newsForm.sourceUrl || undefined,
      sourceName: newsForm.sourceName || undefined,
      imageUrl: newsForm.imageUrl || undefined,
    });
  };

  // Loading and auth checks
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card border-border p-8 text-center max-w-md">
          <CardTitle className="mb-4">權限不足</CardTitle>
          <CardDescription className="mb-4">您需要管理員權限才能存取此頁面</CardDescription>
          <Link href="/">
            <Button>返回首頁</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card border-border p-8 text-center max-w-md">
          <CardTitle className="mb-4">候選人不存在</CardTitle>
          <Link href="/admin">
            <Button>返回管理後台</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isAnyLoading = searchPolicies.isPending || searchNews.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                返回管理後台
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold" style={{ color: "#0A2342" }}>
                編輯候選人：{candidate.name}
              </h1>
            </div>
            <Button onClick={handleSaveCandidate} disabled={updateCandidate.isPending}>
              <Save className="w-4 h-4 mr-2" />
              儲存變更
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Candidate Info */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  基本資料
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photo */}
                <div className="flex justify-center mb-4">
                  {candidateForm.photoUrl ? (
                    <img 
                      src={candidateForm.photoUrl} 
                      alt={candidateForm.name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-border"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                      <User className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>照片網址</Label>
                  <Input 
                    value={candidateForm.photoUrl}
                    onChange={(e) => setCandidateForm({...candidateForm, photoUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label>姓名</Label>
                  <Input 
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm({...candidateForm, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label>政黨</Label>
                  <Select value={candidateForm.party} onValueChange={(v) => setCandidateForm({...candidateForm, party: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇政黨" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTIES.map(p => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>職位類型</Label>
                  <Select value={candidateForm.positionType} onValueChange={(v) => setCandidateForm({...candidateForm, positionType: v as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_TYPES.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>縣市</Label>
                  <Select value={candidateForm.county} onValueChange={(v) => setCandidateForm({...candidateForm, county: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTIES.map(c => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>選區</Label>
                  <Input 
                    value={candidateForm.district}
                    onChange={(e) => setCandidateForm({...candidateForm, district: e.target.value})}
                    placeholder="例如：第一選區"
                  />
                </div>

                <div>
                  <Label>年齡</Label>
                  <Input 
                    type="number"
                    value={candidateForm.age}
                    onChange={(e) => setCandidateForm({...candidateForm, age: e.target.value})}
                  />
                </div>

                <div>
                  <Label>學歷</Label>
                  <Textarea 
                    value={candidateForm.education}
                    onChange={(e) => setCandidateForm({...candidateForm, education: e.target.value})}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>經歷</Label>
                  <Textarea 
                    value={candidateForm.experience}
                    onChange={(e) => setCandidateForm({...candidateForm, experience: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch 
                    checked={candidateForm.isIncumbent}
                    onCheckedChange={(v) => setCandidateForm({...candidateForm, isIncumbent: v})}
                  />
                  <Label>現任</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Policies and News */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="policies">
              <TabsList className="w-full justify-start bg-card border-b border-border rounded-none h-auto p-0 mb-6">
                <TabsTrigger 
                  value="policies" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  政見 ({policies?.length || 0})
                </TabsTrigger>
                <TabsTrigger 
                  value="news"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  <Newspaper className="w-4 h-4 mr-2" />
                  新聞 ({news?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Policies Tab */}
              <TabsContent value="policies">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">政見列表</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => searchPolicies.mutate({ candidateId })}
                      disabled={isAnyLoading}
                    >
                      {searchPolicies.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      AI 搜尋政見
                    </Button>
                    <Dialog open={isPolicyDialogOpen} onOpenChange={(open) => {
                      setIsPolicyDialogOpen(open);
                      if (!open) {
                        setEditingPolicy(null);
                        resetPolicyForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          新增政見
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{editingPolicy ? "編輯政見" : "新增政見"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>議題類別</Label>
                            <Select value={policyForm.categoryId} onValueChange={(v) => setPolicyForm({...policyForm, categoryId: v})}>
                              <SelectTrigger>
                                <SelectValue placeholder="選擇類別" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((c: { id: number; name: string }) => (
                                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>標題 *</Label>
                            <Input 
                              value={policyForm.title}
                              onChange={(e) => setPolicyForm({...policyForm, title: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>摘要</Label>
                            <Textarea 
                              value={policyForm.summary}
                              onChange={(e) => setPolicyForm({...policyForm, summary: e.target.value})}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>詳細內容</Label>
                            <Textarea 
                              value={policyForm.content}
                              onChange={(e) => setPolicyForm({...policyForm, content: e.target.value})}
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label>來源</Label>
                            <Input 
                              value={policyForm.source}
                              onChange={(e) => setPolicyForm({...policyForm, source: e.target.value})}
                              placeholder="政見來源網址或說明"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={policyForm.isHighlight}
                              onCheckedChange={(v) => setPolicyForm({...policyForm, isHighlight: v})}
                            />
                            <Label>重點政見</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">取消</Button>
                          </DialogClose>
                          <Button 
                            onClick={handleSubmitPolicy}
                            disabled={!policyForm.title || createPolicy.isPending || updatePolicy.isPending}
                          >
                            {editingPolicy ? "更新" : "新增"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-4">
                  {policies?.map((policy) => (
                    <Card key={policy.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {policy.isHighlight && (
                                <Badge variant="default" className="text-xs">重點</Badge>
                              )}
                              <h4 className="font-medium">{policy.title}</h4>
                            </div>
                            {policy.summary && (
                              <p className="text-sm text-muted-foreground mb-2">{policy.summary}</p>
                            )}
                            {policy.source && (
                              <p className="text-xs text-muted-foreground">來源: {policy.source}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPolicy(policy)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                if (confirm("確定要刪除此政見嗎？")) {
                                  deletePolicy.mutate({ id: policy.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!policies || policies.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      尚無政見資料，點擊「AI 搜尋政見」或「新增政見」開始
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* News Tab */}
              <TabsContent value="news">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">新聞列表</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => searchNews.mutate({ candidateId })}
                      disabled={isAnyLoading}
                    >
                      {searchNews.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      AI 搜尋新聞
                    </Button>
                    <Dialog open={isNewsDialogOpen} onOpenChange={(open) => {
                      setIsNewsDialogOpen(open);
                      if (!open) resetNewsForm();
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          新增新聞
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>新增新聞</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>標題 *</Label>
                            <Input 
                              value={newsForm.title}
                              onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label>摘要</Label>
                            <Textarea 
                              value={newsForm.summary}
                              onChange={(e) => setNewsForm({...newsForm, summary: e.target.value})}
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>來源網址</Label>
                            <Input 
                              value={newsForm.sourceUrl}
                              onChange={(e) => setNewsForm({...newsForm, sourceUrl: e.target.value})}
                              placeholder="https://..."
                            />
                          </div>
                          <div>
                            <Label>來源名稱</Label>
                            <Input 
                              value={newsForm.sourceName}
                              onChange={(e) => setNewsForm({...newsForm, sourceName: e.target.value})}
                              placeholder="例如：自由時報"
                            />
                          </div>
                          <div>
                            <Label>圖片網址</Label>
                            <Input 
                              value={newsForm.imageUrl}
                              onChange={(e) => setNewsForm({...newsForm, imageUrl: e.target.value})}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">取消</Button>
                          </DialogClose>
                          <Button 
                            onClick={handleSubmitNews}
                            disabled={!newsForm.title || createNews.isPending}
                          >
                            新增
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-4">
                  {news?.map((item) => (
                    <Card key={item.id} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{item.title}</h4>
                            {item.summary && (
                              <p className="text-sm text-muted-foreground mb-2">{item.summary}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {item.sourceName && <span>{item.sourceName}</span>}
                              {item.sourceUrl && (
                                <a 
                                  href={item.sourceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  查看原文 <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm("確定要刪除此新聞嗎？")) {
                                deleteNews.mutate({ id: item.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {(!news || news.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      尚無新聞資料，點擊「AI 搜尋新聞」或「新增新聞」開始
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* News Search Results Dialog */}
      <Dialog open={isNewsSearchDialogOpen} onOpenChange={setIsNewsSearchDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>搜尋結果 - 選擇要新增的新聞</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {newsSearchResults.map((item, index) => (
              <Card key={index} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{item.sourceName}</Badge>
                        <a 
                          href={item.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          查看原文 <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={createNews.isPending}
                      onClick={async () => {
                        try {
                          toast.info("正在讀取新聞內容並生成摘要...");
                          const result = await createNews.mutateAsync({
                            candidateId,
                            title: item.title,
                            summary: "", // Will be auto-generated by backend
                            sourceUrl: item.sourceUrl,
                            sourceName: item.sourceName,
                          });
                          // Remove from list after adding
                          setNewsSearchResults(prev => prev.filter((_, i) => i !== index));
                          if (result.summary) {
                            toast.success("已新增新聞並自動生成摘要");
                          } else {
                            toast.success("已新增新聞");
                          }
                        } catch (e: any) {
                          toast.error(e.message || "新增失敗");
                        }
                      }}
                    >
                      {createNews.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
                      )}
                      {createNews.isPending ? "處理中..." : "新增"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {newsSearchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                所有新聞已新增完成
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewsSearchDialogOpen(false)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
