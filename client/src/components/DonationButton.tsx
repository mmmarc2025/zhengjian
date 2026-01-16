import { Heart, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Stripe 贊助連結
const STRIPE_DONATION_URL = "https://donate.stripe.com/fZu14ocP837LgY3btO4Ja0i";

export function DonationButton() {
  const [open, setOpen] = useState(false);

  const handleDonate = () => {
    window.open(STRIPE_DONATION_URL, "_blank");
  };

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
            {/* 贊助說明 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">您的贊助將用於：</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 網站維運與伺服器費用</li>
                <li>• 候選人資料蒐集與整理</li>
                <li>• AI 自動化內容更新</li>
                <li>• 持續開發新功能</li>
              </ul>
            </div>

            {/* Stripe 贊助按鈕 */}
            <Button
              className="w-full h-14 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-lg font-medium"
              onClick={handleDonate}
            >
              <Heart className="w-5 h-5 mr-2 fill-current" />
              前往贊助頁面
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              透過 Stripe 安全付款，支援信用卡、Apple Pay、Google Pay
            </p>

            {/* 感謝訊息 */}
            <div className="text-center pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                每一份支持都是我們前進的動力 ❤️
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
