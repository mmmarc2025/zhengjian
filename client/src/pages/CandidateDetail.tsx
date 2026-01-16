import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { 
  Vote, ChevronLeft, MapPin, Building2, GraduationCap, 
  Briefcase, Globe, Facebook, Instagram, Youtube,
  FileText, MessageSquare, Send, User, Calendar,
  ExternalLink, Newspaper, RefreshCw, Clock
} from "lucide-react";
import { useState } from "react";
import { PARTIES, POSITION_TYPES, ISSUE_CATEGORIES } from "@shared/constants";
import { toast } from "sonner";

export default function CandidateDetail() {
  const params = useParams<{ id: string }>();
  const candidateId = parseInt(params.id || "0");
  const { user } = useAuth();
  const [commentContent, setCommentContent] = useState("");

  const { data: candidate, isLoading } = trpc.candidate.getById.useQuery(
    { id: candidateId },
    { enabled: candidateId > 0 }
  );

  const { data: policies } = trpc.policy.getByCandidateId.useQuery(
    { candidateId },
    { enabled: candidateId > 0 }
  );

  const { data: comments, refetch: refetchComments } = trpc.comment.list.useQuery(
    { candidateId, limit: 50 },
    { enabled: candidateId > 0 }
  );

  const { data: candidateNews, isLoading: isLoadingNews, refetch: refetchNews } = trpc.candidateNews.getByCandidateId.useQuery(
    { candidateId, limit: 20 },
    { enabled: candidateId > 0 }
  );

  const searchAndAddNews = trpc.candidateNews.searchAndAdd.useMutation({
    onSuccess: (data) => {
      refetchNews();
      toast.success(`已為 ${data.candidateName} 更新 ${data.addedCount} 則新聞`);
    },
    onError: (error) => {
      toast.error(error.message || "更新新聞失敗");
    },
  });

  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      refetchComments();
      toast.success("留言已送出");
    },
    onError: (error) => {
      toast.error(error.message || "留言失敗，請稍後再試");
    },
  });

  const handleSubmitComment = () => {
    if (!commentContent.trim()) return;
    if (!user) {
      toast.error("請先登入後再留言");
      return;
    }
    createComment.mutate({
      candidateId,
      content: commentContent.trim(),
    });
  };

  const handleRefreshNews = () => {
    if (user?.role !== "admin") {
      toast.error("只有管理員可以手動更新新聞");
      return;
    }
    searchAndAddNews.mutate({ candidateId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card border-border p-8 text-center">
          <h2 className="text-xl font-bold mb-2">找不到候選人</h2>
          <p className="text-muted-foreground mb-4">該候選人可能已被移除或不存在</p>
          <Link href="/candidates">
            <Button>返回候選人列表</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const partyInfo = PARTIES.find(p => p.name === candidate.party);
  const positionInfo = POSITION_TYPES.find(p => p.id === candidate.positionType);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Vote className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">政見</span>
          </Link>
          <ThemeSwitcher />
        </div>
      </nav>

      <main className="pt-24 pb-12">
        <div className="container">
          {/* Back Button */}
          <Link href="/candidates">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2">
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回候選人列表
            </Button>
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border sticky top-24">
                <CardContent className="p-6">
                  {/* Photo */}
                  <div className="w-32 h-32 mx-auto rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground overflow-hidden mb-4">
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

                  {/* Name & Party */}
                  <h1 className="text-2xl font-bold text-center mb-2">{candidate.name}</h1>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {candidate.party && (
                      <Badge 
                        style={{ 
                          backgroundColor: partyInfo?.color + "20",
                          color: partyInfo?.color,
                          borderColor: partyInfo?.color + "50"
                        }}
                      >
                        {candidate.party}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {positionInfo?.name || candidate.positionType}
                    </Badge>
                    {candidate.isIncumbent && (
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        現任
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Info List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span>{candidate.county} {candidate.district || ""}</span>
                    </div>
                    
                    {candidate.constituency && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{candidate.constituency}</span>
                      </div>
                    )}

                    {candidate.age && (
                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{candidate.age} 歲</span>
                      </div>
                    )}

                    {candidate.education && (
                      <div className="flex items-start gap-3 text-sm">
                        <GraduationCap className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-wrap">{candidate.education}</span>
                      </div>
                    )}

                    {candidate.experience && (
                      <div className="flex items-start gap-3 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-wrap">{candidate.experience}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {(candidate.website || candidate.socialMedia) && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex justify-center gap-3">
                        {candidate.website && (
                          <a 
                            href={candidate.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Globe className="w-5 h-5" />
                          </a>
                        )}
                        {candidate.socialMedia?.facebook && (
                          <a 
                            href={candidate.socialMedia.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
                        {candidate.socialMedia?.instagram && (
                          <a 
                            href={candidate.socialMedia.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {candidate.socialMedia?.youtube && (
                          <a 
                            href={candidate.socialMedia.youtube} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <Youtube className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </>
                  )}

                  {/* Compare Button */}
                  <Separator className="my-4" />
                  <Link href={`/compare?ids=${candidate.id}`}>
                    <Button variant="outline" className="w-full">
                      加入比較
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="policies" className="w-full">
                <TabsList className="w-full justify-start bg-card border-b border-border rounded-none h-auto p-0">
                  <TabsTrigger 
                    value="policies" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    政見主張
                  </TabsTrigger>
                  <TabsTrigger 
                    value="news"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <Newspaper className="w-4 h-4 mr-2" />
                    最新新聞
                    {candidateNews && candidateNews.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {candidateNews.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    公民討論
                    {comments && comments.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {comments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Policies Tab */}
                <TabsContent value="policies" className="mt-6">
                  {policies && policies.length > 0 ? (
                    <div className="space-y-4">
                      {policies.map((policy) => {
                        const category = ISSUE_CATEGORIES.find(c => c.id === policy.categoryId?.toString());
                        return (
                          <Card key={policy.id} className="bg-card border-border">
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-4">
                                <CardTitle className="text-lg">{policy.title}</CardTitle>
                                <div className="flex gap-2 flex-shrink-0">
                                  {category && (
                                    <Badge variant="outline">{category.name}</Badge>
                                  )}
                                  {policy.isHighlight && (
                                    <Badge className="bg-primary/20 text-primary">重點政見</Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {policy.summary && (
                                <p className="text-muted-foreground mb-3">{policy.summary}</p>
                              )}
                              {policy.content && (
                                <div className="text-sm whitespace-pre-wrap">{policy.content}</div>
                              )}
                              {policy.source && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <a 
                                    href={policy.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    資料來源
                                  </a>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="bg-card border-border">
                      <CardContent className="p-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">尚無政見資料</h3>
                        <p className="text-muted-foreground">
                          該候選人的政見資料正在整理中，請稍後再查看
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* News Tab */}
                <TabsContent value="news" className="mt-6">
                  {/* Admin Refresh Button */}
                  {user?.role === "admin" && (
                    <div className="flex justify-end mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRefreshNews}
                        disabled={searchAndAddNews.isPending}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${searchAndAddNews.isPending ? 'animate-spin' : ''}`} />
                        {searchAndAddNews.isPending ? "搜尋中..." : "AI 搜尋最新新聞"}
                      </Button>
                    </div>
                  )}

                  {isLoadingNews ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : candidateNews && candidateNews.length > 0 ? (
                    <div className="space-y-4">
                      {candidateNews.map((newsItem) => (
                        <Card key={newsItem.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-lg leading-tight">{newsItem.title}</CardTitle>
                              {newsItem.topic && (
                                <Badge variant="outline" className="flex-shrink-0">
                                  {newsItem.topic}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            {newsItem.summary && (
                              <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                                {newsItem.summary}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                {newsItem.sourceName && (
                                  <span className="flex items-center gap-1">
                                    <Newspaper className="w-3 h-3" />
                                    {newsItem.sourceName}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(newsItem.publishedAt).toLocaleDateString("zh-TW")}
                                </span>
                              </div>
                              {newsItem.sourceUrl && (
                                <a 
                                  href={newsItem.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  閱讀全文
                                </a>
                              )}
                            </div>
                            {newsItem.isAutoGenerated && (
                              <div className="mt-2 text-xs text-muted-foreground/60">
                                由 AI 自動搜尋整理
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-card border-border">
                      <CardContent className="p-12 text-center">
                        <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">尚無相關新聞</h3>
                        <p className="text-muted-foreground mb-4">
                          目前沒有該候選人的最新新聞
                        </p>
                        {user?.role === "admin" && (
                          <Button 
                            variant="outline"
                            onClick={handleRefreshNews}
                            disabled={searchAndAddNews.isPending}
                          >
                            <RefreshCw className={`w-4 h-4 mr-2 ${searchAndAddNews.isPending ? 'animate-spin' : ''}`} />
                            {searchAndAddNews.isPending ? "搜尋中..." : "AI 搜尋新聞"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="mt-6">
                  {/* Comment Form */}
                  <Card className="bg-card border-border mb-6">
                    <CardContent className="p-4">
                      <Textarea
                        placeholder={user ? "分享您對這位候選人的看法..." : "請先登入後再留言"}
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        disabled={!user}
                        className="mb-3 bg-input resize-none"
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          請保持理性討論，尊重不同意見
                        </p>
                        <Button 
                          onClick={handleSubmitComment}
                          disabled={!user || !commentContent.trim() || createComment.isPending}
                          size="sm"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {createComment.isPending ? "送出中..." : "送出留言"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments List */}
                  {comments && comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((item) => (
                        <Card key={item.comment.id} className="bg-card border-border">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                                {item.user?.name?.charAt(0) || "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">
                                    {item.user?.name || "匿名用戶"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    {new Date(item.comment.createdAt).toLocaleDateString("zh-TW")}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{item.comment.content}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-card border-border">
                      <CardContent className="p-12 text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">尚無討論</h3>
                        <p className="text-muted-foreground">
                          成為第一個分享看法的人吧！
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
