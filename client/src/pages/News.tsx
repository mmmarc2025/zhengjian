import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Vote, ChevronLeft, Newspaper, Calendar, ExternalLink, Pin } from "lucide-react";

export default function News() {
  const { data: news, isLoading } = trpc.news.list.useQuery({ limit: 50 });

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
            <Link href="/candidates" className="transition-colors hover:opacity-70" style={{ color: '#0A2342' }}>
              候選人
            </Link>
            <Link href="/news" className="font-medium" style={{ color: '#A81C31' }}>
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
            <div className="flex items-center gap-3 mb-2">
              <Newspaper className="w-10 h-10" style={{ color: '#A81C31' }} />
              <h1 className="text-4xl font-bold" style={{ color: '#0A2342' }}>最新動態</h1>
            </div>
            <p style={{ color: '#718096' }}>
              2026 九合一選舉最新消息與候選人動態
            </p>
          </div>

          {/* News List */}
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-card border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="w-48 h-32 bg-muted rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                        <div className="h-4 bg-muted rounded w-full mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <div className="space-y-6">
              {news.map((item) => (
                <Card 
                  key={item.id} 
                  className={`bg-card border-border hover:border-primary/50 transition-all ${
                    item.isPinned ? "border-primary/30" : ""
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {item.imageUrl && (
                        <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          {item.isPinned && (
                            <Badge className="bg-primary/20 text-primary flex-shrink-0">
                              <Pin className="w-3 h-3 mr-1" />
                              置頂
                            </Badge>
                          )}
                          <h2 className="text-xl font-bold line-clamp-2">{item.title}</h2>
                        </div>
                        
                        {item.summary && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {item.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(item.publishedAt).toLocaleDateString("zh-TW", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                          
                          {item.sourceName && (
                            <span>來源：{item.sourceName}</span>
                          )}
                          
                          {item.sourceUrl && (
                            <a 
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              查看原文
                            </a>
                          )}
                        </div>

                        {item.content && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm whitespace-pre-wrap line-clamp-4">
                              {item.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">尚無新聞動態</h3>
                <p className="text-muted-foreground">
                  目前尚無最新消息，請稍後再查看
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
