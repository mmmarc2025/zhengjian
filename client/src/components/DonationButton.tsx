import { Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DonationButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 浮動愛心按鈕 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-pulse hover:animate-none"
        aria-label="贊助我們"
      >
        <Heart className="w-7 h-7 fill-current" />
      </button>

      {/* 贊助對話框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              支持「政見 political.now」
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              感謝您對台灣民主的關心！您的贊助將幫助我們持續提供公正、透明的選舉資訊。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* 贊助選項 */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center border-2 hover:border-red-500 hover:bg-red-50"
                onClick={() => window.open("https://example.com/donate/100", "_blank")}
              >
                <span className="text-lg font-bold">$100</span>
                <span className="text-xs text-muted-foreground">小額支持</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center border-2 hover:border-red-500 hover:bg-red-50"
                onClick={() => window.open("https://example.com/donate/500", "_blank")}
              >
                <span className="text-lg font-bold">$500</span>
                <span className="text-xs text-muted-foreground">熱情贊助</span>
              </Button>
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center border-2 hover:border-red-500 hover:bg-red-50"
                onClick={() => window.open("https://example.com/donate/1000", "_blank")}
              >
                <span className="text-lg font-bold">$1000</span>
                <span className="text-xs text-muted-foreground">大力支持</span>
              </Button>
            </div>

            {/* 自訂金額 */}
            <Button
              className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
              onClick={() => window.open("https://example.com/donate", "_blank")}
            >
              <Heart className="w-4 h-4 mr-2" />
              自訂金額贊助
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              所有贊助款項將用於網站維運與內容製作
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
