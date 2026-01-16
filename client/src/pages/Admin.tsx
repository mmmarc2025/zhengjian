import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { 
  Vote, ChevronLeft, Users, FileText, Newspaper, MessageSquare,
  Plus, Pencil, Trash2, Check, X, Shield, BarChart3, Settings,
  Sparkles, RefreshCw, Zap, Camera, ImageIcon, ExternalLink
} from "lucide-react";
import { useState } from "react";
import { COUNTIES, PARTIES, POSITION_TYPES, ISSUE_CATEGORIES } from "@shared/constants";
import { toast } from "sonner";

export default function Admin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
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
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">權限不足</h2>
          <p className="text-muted-foreground mb-4">
            您沒有管理員權限，無法存取此頁面
          </p>
          <Link href="/">
            <Button>返回首頁</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - White background */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Vote className="w-8 h-8" style={{ color: '#A81C31' }} />
            <span className="text-xl font-bold" style={{ color: '#A81C31' }}>政見</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Badge className="text-white" style={{ backgroundColor: '#A81C31' }}>
              <Shield className="w-3 h-3 mr-1" />
              管理員
            </Badge>
            <span className="text-sm" style={{ color: '#718096' }}>{user.name}</span>
          </div>
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
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-10 h-10" style={{ color: '#A81C31' }} />
              <h1 className="text-4xl font-bold" style={{ color: '#0A2342' }}>管理後台</h1>
            </div>
            <p style={{ color: '#718096' }}>
              管理候選人資料、政見、新聞與留言
            </p>
          </div>

          {/* Admin Tabs */}
          <Tabs defaultValue="candidates" className="w-full">
            <TabsList className="w-full justify-start bg-card border-b border-border rounded-none h-auto p-0 mb-6">
              <TabsTrigger 
                value="candidates" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Users className="w-4 h-4 mr-2" />
                候選人
              </TabsTrigger>
              <TabsTrigger 
                value="policies"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                政見
              </TabsTrigger>
              <TabsTrigger 
                value="news"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Newspaper className="w-4 h-4 mr-2" />
                新聞
              </TabsTrigger>
              <TabsTrigger 
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                留言審核
              </TabsTrigger>
              <TabsTrigger 
                value="stats"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                統計
              </TabsTrigger>
            </TabsList>

            <TabsContent value="candidates">
              <CandidatesAdmin />
            </TabsContent>

            <TabsContent value="policies">
              <PoliciesAdmin />
            </TabsContent>

            <TabsContent value="news">
              <NewsAdmin />
            </TabsContent>

            <TabsContent value="comments">
              <CommentsAdmin />
            </TabsContent>

            <TabsContent value="stats">
              <StatsAdmin />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Candidates Management
function CandidatesAdmin() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<any>(null);
  
  const { data: candidates, refetch } = trpc.candidate.list.useQuery({ limit: 100 });
  const createCandidate = trpc.candidate.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      toast.success("候選人已新增");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateCandidate = trpc.candidate.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      setEditingCandidate(null);
      toast.success("候選人已更新");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteCandidate = trpc.candidate.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("候選人已刪除");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    name: "",
    party: "",
    positionType: "mayor" as const,
    county: "",
    district: "",
    age: "",
    education: "",
    experience: "",
    isIncumbent: false,
  });

  const resetForm = () => {
    setForm({
      name: "",
      party: "",
      positionType: "mayor",
      county: "",
      district: "",
      age: "",
      education: "",
      experience: "",
      isIncumbent: false,
    });
  };

  const handleEdit = (candidate: any) => {
    setEditingCandidate(candidate);
    setForm({
      name: candidate.name,
      party: candidate.party || "",
      positionType: candidate.positionType,
      county: candidate.county,
      district: candidate.district || "",
      age: candidate.age?.toString() || "",
      education: candidate.education || "",
      experience: candidate.experience || "",
      isIncumbent: candidate.isIncumbent || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      ...form,
      age: form.age ? parseInt(form.age) : undefined,
    };

    if (editingCandidate) {
      updateCandidate.mutate({ id: editingCandidate.id, ...data });
    } else {
      createCandidate.mutate(data as any);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">候選人管理</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCandidate(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新增候選人
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCandidate ? "編輯候選人" : "新增候選人"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>姓名 *</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    placeholder="候選人姓名"
                  />
                </div>
                <div>
                  <Label>政黨</Label>
                  <Select value={form.party} onValueChange={(v) => setForm({...form, party: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇政黨" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTIES.map((p) => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>職位類型 *</Label>
                  <Select value={form.positionType} onValueChange={(v: any) => setForm({...form, positionType: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITION_TYPES.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>縣市 *</Label>
                  <Select value={form.county} onValueChange={(v) => setForm({...form, county: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇縣市" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTIES.map((c) => (
                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>選區</Label>
                  <Input 
                    value={form.district} 
                    onChange={(e) => setForm({...form, district: e.target.value})}
                    placeholder="如：第一選區"
                  />
                </div>
                <div>
                  <Label>年齡</Label>
                  <Input 
                    type="number"
                    value={form.age} 
                    onChange={(e) => setForm({...form, age: e.target.value})}
                    placeholder="年齡"
                  />
                </div>
              </div>
              <div>
                <Label>學歷</Label>
                <Textarea 
                  value={form.education} 
                  onChange={(e) => setForm({...form, education: e.target.value})}
                  placeholder="學歷背景"
                  rows={2}
                />
              </div>
              <div>
                <Label>經歷</Label>
                <Textarea 
                  value={form.experience} 
                  onChange={(e) => setForm({...form, experience: e.target.value})}
                  placeholder="政治或工作經歷"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={form.isIncumbent}
                  onCheckedChange={(v) => setForm({...form, isIncumbent: v})}
                />
                <Label>現任</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button 
                onClick={handleSubmit}
                disabled={!form.name || !form.county || createCandidate.isPending || updateCandidate.isPending}
              >
                {editingCandidate ? "更新" : "新增"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>政黨</TableHead>
              <TableHead>職位</TableHead>
              <TableHead>縣市</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates?.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell>
                  {candidate.party && (
                    <Badge variant="outline" className="text-xs">
                      {candidate.party}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {POSITION_TYPES.find(p => p.id === candidate.positionType)?.name}
                </TableCell>
                <TableCell>{candidate.county}</TableCell>
                <TableCell>
                  {candidate.isIncumbent && (
                    <Badge variant="secondary" className="text-xs">現任</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEdit(candidate)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm("確定要刪除此候選人嗎？")) {
                        deleteCandidate.mutate({ id: candidate.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!candidates || candidates.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  尚無候選人資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Policies Management
function PoliciesAdmin() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  
  const { data: candidates } = trpc.candidate.list.useQuery({ limit: 100 });
  const { data: policies, refetch } = trpc.policy.getByCandidateId.useQuery(
    { candidateId: parseInt(selectedCandidateId) },
    { enabled: !!selectedCandidateId }
  );
  const { data: categories } = trpc.category.list.useQuery();
  
  const createPolicy = trpc.policy.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      toast.success("政見已新增");
    },
    onError: (e) => toast.error(e.message),
  });
  const deletePolicy = trpc.policy.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("政見已刪除");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    categoryId: "",
    isHighlight: false,
  });

  const handleSubmit = () => {
    if (!selectedCandidateId) return;
    createPolicy.mutate({
      candidateId: parseInt(selectedCandidateId),
      title: form.title,
      summary: form.summary || undefined,
      content: form.content || undefined,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      isHighlight: form.isHighlight,
    });
    setForm({ title: "", summary: "", content: "", categoryId: "", isHighlight: false });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">政見管理</h2>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Candidate Selection */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">選擇候選人</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
              <SelectTrigger>
                <SelectValue placeholder="選擇候選人" />
              </SelectTrigger>
              <SelectContent>
                {candidates?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} ({c.county})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Policies List */}
        <div className="md:col-span-3">
          {selectedCandidateId ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">
                  {candidates?.find(c => c.id === parseInt(selectedCandidateId))?.name} 的政見
                </h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      新增政見
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新增政見</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label>標題 *</Label>
                        <Input 
                          value={form.title} 
                          onChange={(e) => setForm({...form, title: e.target.value})}
                          placeholder="政見標題"
                        />
                      </div>
                      <div>
                        <Label>類別</Label>
                        <Select value={form.categoryId} onValueChange={(v) => setForm({...form, categoryId: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇類別" />
                          </SelectTrigger>
                          <SelectContent>
                            {ISSUE_CATEGORIES.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>摘要</Label>
                        <Textarea 
                          value={form.summary} 
                          onChange={(e) => setForm({...form, summary: e.target.value})}
                          placeholder="政見摘要"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label>詳細內容</Label>
                        <Textarea 
                          value={form.content} 
                          onChange={(e) => setForm({...form, content: e.target.value})}
                          placeholder="政見詳細內容"
                          rows={4}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={form.isHighlight}
                          onCheckedChange={(v) => setForm({...form, isHighlight: v})}
                        />
                        <Label>設為重點政見</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">取消</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleSubmit}
                        disabled={!form.title || createPolicy.isPending}
                      >
                        新增
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {policies?.map((policy) => (
                  <Card key={policy.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{policy.title}</h4>
                            {policy.isHighlight && (
                              <Badge className="bg-primary/20 text-primary text-xs">重點</Badge>
                            )}
                          </div>
                          {policy.summary && (
                            <p className="text-sm text-muted-foreground">{policy.summary}</p>
                          )}
                        </div>
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
                    </CardContent>
                  </Card>
                ))}
                {(!policies || policies.length === 0) && (
                  <Card className="bg-card border-border">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      尚無政見資料
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center text-muted-foreground">
                請先選擇候選人
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// News Management
function NewsAdmin() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: news, refetch } = trpc.news.listAll.useQuery({ limit: 50 });
  const createNews = trpc.news.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsDialogOpen(false);
      toast.success("新聞已新增");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteNews = trpc.news.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("新聞已刪除");
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    sourceUrl: "",
    sourceName: "",
    isPublished: true,
    isPinned: false,
  });

  const handleSubmit = () => {
    createNews.mutate({
      title: form.title,
      summary: form.summary || undefined,
      content: form.content || undefined,
      sourceUrl: form.sourceUrl || undefined,
      sourceName: form.sourceName || undefined,
      isPublished: form.isPublished,
      isPinned: form.isPinned,
    });
    setForm({ title: "", summary: "", content: "", sourceUrl: "", sourceName: "", isPublished: true, isPinned: false });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">新聞管理</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新增新聞
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>新增新聞</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>標題 *</Label>
                <Input 
                  value={form.title} 
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="新聞標題"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>來源名稱</Label>
                  <Input 
                    value={form.sourceName} 
                    onChange={(e) => setForm({...form, sourceName: e.target.value})}
                    placeholder="如：聯合報"
                  />
                </div>
                <div>
                  <Label>來源連結</Label>
                  <Input 
                    value={form.sourceUrl} 
                    onChange={(e) => setForm({...form, sourceUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <Label>摘要</Label>
                <Textarea 
                  value={form.summary} 
                  onChange={(e) => setForm({...form, summary: e.target.value})}
                  placeholder="新聞摘要"
                  rows={2}
                />
              </div>
              <div>
                <Label>內容</Label>
                <Textarea 
                  value={form.content} 
                  onChange={(e) => setForm({...form, content: e.target.value})}
                  placeholder="新聞內容"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={form.isPublished}
                    onCheckedChange={(v) => setForm({...form, isPublished: v})}
                  />
                  <Label>發布</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={form.isPinned}
                    onCheckedChange={(v) => setForm({...form, isPinned: v})}
                  />
                  <Label>置頂</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button 
                onClick={handleSubmit}
                disabled={!form.title || createNews.isPending}
              >
                新增
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>標題</TableHead>
              <TableHead>來源</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>發布時間</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {item.isPinned && <Badge className="mr-2 bg-primary/20 text-primary text-xs">置頂</Badge>}
                  {item.title}
                </TableCell>
                <TableCell>{item.sourceName || "-"}</TableCell>
                <TableCell>
                  <Badge variant={item.isPublished ? "default" : "secondary"}>
                    {item.isPublished ? "已發布" : "草稿"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(item.publishedAt).toLocaleDateString("zh-TW")}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
            {(!news || news.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  尚無新聞資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Comments Moderation
function CommentsAdmin() {
  const { data: comments, refetch } = trpc.comment.listAll.useQuery({ limit: 100 });
  const updateStatus = trpc.comment.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("留言狀態已更新");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteComment = trpc.comment.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("留言已刪除");
    },
    onError: (e) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500">已通過</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500">待審核</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500">已拒絕</Badge>;
      case "hidden":
        return <Badge variant="secondary">已隱藏</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">留言審核</h2>
      </div>

      <Card className="bg-card border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用戶</TableHead>
              <TableHead className="max-w-md">內容</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>時間</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments?.map((item) => (
              <TableRow key={item.comment.id}>
                <TableCell>{item.user?.name || "匿名"}</TableCell>
                <TableCell className="max-w-md truncate">{item.comment.content}</TableCell>
                <TableCell>{getStatusBadge(item.comment.status)}</TableCell>
                <TableCell>
                  {new Date(item.comment.createdAt).toLocaleDateString("zh-TW")}
                </TableCell>
                <TableCell className="text-right">
                  {item.comment.status !== "approved" && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: item.comment.id, status: "approved" })}
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                  )}
                  {item.comment.status !== "hidden" && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => updateStatus.mutate({ id: item.comment.id, status: "hidden" })}
                    >
                      <X className="w-4 h-4 text-yellow-500" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm("確定要刪除此留言嗎？")) {
                        deleteComment.mutate({ id: item.comment.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!comments || comments.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  尚無留言
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Statistics
function StatsAdmin() {
  const { data: stats, refetch: refetchStats } = trpc.stats.get.useQuery();
  const seedCategories = trpc.stats.seed.useMutation({
    onSuccess: () => toast.success("議題類別已初始化"),
    onError: (e) => toast.error(e.message),
  });

  // AI 自動更新功能
  const [searchCounty, setSearchCounty] = useState("台中市");
  const [searchPositionType, setSearchPositionType] = useState<"mayor" | "councilor">("councilor");

  // 新的自動搜尋候選人功能 (Gemini Search Grounding)
  const quickSearch = trpc.autoUpdate.quickSearch.useMutation({
    onSuccess: (data) => {
      if (data.added > 0) {
        toast.success(`已新增 ${data.added} 位候選人: ${data.candidates.map(c => c.name).join(", ")}`);
        refetchStats();
      } else {
        toast.info("未找到新的候選人");
      }
    },
    onError: (e) => toast.error(`搜尋失敗: ${e.message}`),
  });

  const runFullUpdate = trpc.autoUpdate.runFull.useMutation({
    onSuccess: (data) => {
      toast.success(`完成更新: 新增 ${data.newCandidatesAdded} 位候選人, ${data.newsUpdated} 則新聞`);
      refetchStats();
    },
    onError: (e) => toast.error(`更新失敗: ${e.message}`),
  });

  const batchUpdatePolicies = trpc.ai.batchUpdatePolicies.useMutation({
    onSuccess: (data) => {
      toast.success(`已為 ${data.totalCandidates} 位候選人更新政見`);
      refetchStats();
    },
    onError: (e) => toast.error(`更新失敗: ${e.message}`),
  });

  const batchUpdateNews = trpc.ai.batchUpdateNews.useMutation({
    onSuccess: (data) => {
      toast.success(`已為 ${data.totalCandidates} 位候選人更新新聞`);
      refetchStats();
    },
    onError: (e) => toast.error(`更新失敗: ${e.message}`),
  });

  const searchElectionNews = trpc.ai.searchElectionNews.useMutation({
    onSuccess: (data) => {
      toast.success(`找到 ${data.news.length} 則最新選舉新聞`);
    },
    onError: (e) => toast.error(`搜尋失敗: ${e.message}`),
  });

  // 照片搜尋功能
  const [photoSearchCounty, setPhotoSearchCounty] = useState("台北市");
  const [photoSearchResults, setPhotoSearchResults] = useState<Array<{
    id: number;
    name: string;
    photoUrl: string | null;
    source: string | null;
    confidence: "high" | "medium" | "low";
  }>>([]);
  const [isSearchingPhotos, setIsSearchingPhotos] = useState(false);

  const { data: candidatesWithoutPhoto } = trpc.candidate.list.useQuery(
    { county: photoSearchCounty, limit: 100 },
    { enabled: !!photoSearchCounty }
  );

  const searchPhoto = trpc.autoUpdate.searchPhoto.useMutation();
  const updateCandidatePhoto = trpc.autoUpdate.updateCandidatePhoto.useMutation({
    onSuccess: () => {
      toast.success("照片已更新");
      refetchStats();
    },
    onError: (e) => toast.error(`更新失敗: ${e.message}`),
  });

  const handleBatchSearchPhotos = async () => {
    const candidatesNeedPhoto = (candidatesWithoutPhoto || []).filter((c: any) => !c.photoUrl);
    if (candidatesNeedPhoto.length === 0) {
      toast.info("該縣市所有候選人都已有照片");
      return;
    }

    setIsSearchingPhotos(true);
    setPhotoSearchResults([]);
    
    try {
      for (const candidate of candidatesNeedPhoto.slice(0, 10)) {
        const result = await searchPhoto.mutateAsync({
          candidateId: candidate.id,
          candidateName: candidate.name,
          party: candidate.party || "無黨籍",
          county: candidate.county,
        });
        setPhotoSearchResults(prev => [...prev, {
          id: result.candidateId,
          name: result.candidateName,
          photoUrl: result.photoUrl,
          source: result.source,
          confidence: result.confidence,
        }]);
      }
      toast.success(`已搜尋 ${Math.min(candidatesNeedPhoto.length, 10)} 位候選人的照片`);
    } catch (error) {
      toast.error("搜尋照片失敗");
    } finally {
      setIsSearchingPhotos(false);
    }
  };

  const handleConfirmPhoto = (candidateId: number, photoUrl: string) => {
    updateCandidatePhoto.mutate({ candidateId, photoUrl });
    setPhotoSearchResults(prev => prev.filter(r => r.id !== candidateId));
  };

  const isAnyLoading = batchUpdatePolicies.isPending || batchUpdateNews.isPending || searchElectionNews.isPending || quickSearch.isPending || runFullUpdate.isPending || isSearchingPhotos;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">統計數據</h2>
        <Button 
          variant="outline"
          onClick={() => seedCategories.mutate()}
          disabled={seedCategories.isPending}
        >
          初始化議題類別
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardDescription>候選人總數</CardDescription>
            <CardTitle className="text-4xl">{stats?.totalCandidates || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardDescription>政見總數</CardDescription>
            <CardTitle className="text-4xl">{stats?.totalPolicies || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardDescription>留言總數</CardDescription>
            <CardTitle className="text-4xl">{stats?.totalComments || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 自動搜尋候選人區塊 */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-chart-3" />
            自動搜尋候選人
          </CardTitle>
          <CardDescription>
            使用 Gemini Search Grounding 搜尋最新參選人資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label>縣市</Label>
              <Select value={searchCounty} onValueChange={setSearchCounty}>
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
            <div className="flex-1 min-w-[200px]">
              <Label>職位</Label>
              <Select value={searchPositionType} onValueChange={(v) => setSearchPositionType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mayor">縣市長</SelectItem>
                  <SelectItem value="councilor">縣市議員</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => quickSearch.mutate({ county: searchCounty, positionType: searchPositionType })}
                disabled={isAnyLoading}
              >
                {quickSearch.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                搜尋候選人
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => runFullUpdate.mutate({ skipPolicies: true })}
            disabled={isAnyLoading}
          >
            {runFullUpdate.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            全面更新（六都 + 新聞）
          </Button>
        </CardContent>
      </Card>

      {/* 候選人照片搜尋區塊 */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-chart-2" />
            候選人照片搜尋
          </CardTitle>
          <CardDescription>
            為沒有照片的候選人搜尋公開照片
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <Label>縣市</Label>
              <Select value={photoSearchCounty} onValueChange={setPhotoSearchCounty}>
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
            <div className="flex items-end">
              <Button
                onClick={handleBatchSearchPhotos}
                disabled={isAnyLoading}
              >
                {isSearchingPhotos ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                搜尋照片（最多 10 位）
              </Button>
            </div>
          </div>

          {/* 照片搜尋結果 */}
          {photoSearchResults.length > 0 && (
            <div className="space-y-4 mt-4">
              <h4 className="font-medium">搜尋結果（點擊確認儲存）</h4>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {photoSearchResults.map(result => (
                  <Card key={result.id} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {result.photoUrl ? (
                          <img 
                            src={result.photoUrl} 
                            alt={result.name}
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "";
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <Badge variant={result.confidence === "high" ? "default" : result.confidence === "medium" ? "secondary" : "outline"}>
                            {result.confidence === "high" ? "高可信度" : result.confidence === "medium" ? "中可信度" : "低可信度"}
                          </Badge>
                        </div>
                      </div>
                      {result.source && (
                        <p className="text-xs text-muted-foreground mb-2">來源: {result.source}</p>
                      )}
                      {result.photoUrl ? (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleConfirmPhoto(result.id, result.photoUrl!)}
                            disabled={updateCandidatePhoto.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            確認儲存
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(result.photoUrl!, "_blank")}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">未找到照片</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 自動更新區塊 */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI 自動更新功能
          </CardTitle>
          <CardDescription>
            使用 Gemini AI 自動搜尋並更新候選人政見與選舉新聞
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => batchUpdatePolicies.mutate()}
              disabled={isAnyLoading}
            >
              {batchUpdatePolicies.isPending ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
              <span className="font-medium">自動更新政見</span>
              <span className="text-xs text-muted-foreground">為所有候選人搜尋政見</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => batchUpdateNews.mutate()}
              disabled={isAnyLoading}
            >
              {batchUpdateNews.isPending ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Newspaper className="w-6 h-6 text-accent" />
              )}
              <span className="font-medium">自動更新新聞</span>
              <span className="text-xs text-muted-foreground">為所有候選人搜尋新聞</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => searchElectionNews.mutate()}
              disabled={isAnyLoading}
            >
              {searchElectionNews.isPending ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Zap className="w-6 h-6 text-chart-3" />
              )}
              <span className="font-medium">搜尋選舉新聞</span>
              <span className="text-xs text-muted-foreground">搜尋最新選情動態</span>
            </Button>
          </div>

          {isAnyLoading && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <RefreshCw className="w-5 h-5 animate-spin inline-block mr-2" />
              <span className="text-sm">AI 正在處理中，請稍候...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
