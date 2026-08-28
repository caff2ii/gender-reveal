# Case Reveal — 主持人正式流程

所有頁面應從同一個 GitHub Pages 網址開啟：`host.html`、`display.html`、`admin.html`、`secret.html`；玩家掃 `host.html` 顯示的 QR code。

## 開始前

1. 在 `secret.html` 輸入密碼 `1125`，設定 BOY 或 GIRL，但先不要按開始 Reveal。
2. 在 `admin.html` 輸入密碼，按 Reset（只在要開始全新一局時使用）。
3. 在 `host.html` 選擇 `ONBOARDING`，讓玩家輸入名稱及 group，確認主持人頁的玩家人數。

## Game 1

1. Host 選 `GAME1_RULES`，講解規則；然後按 `START GROUP CASES`。
2. 每條題目等待作答後按 `NEXT QUESTION`。系統會依序完成三條 group 題，再轉到五條 common 題。
3. 第五條 common 題是最後 15 秒搶答；等候 15 秒才按結算。
4. 按 `SETTLE GAME 1`，等 Display 排行榜及玩家 clue 提示出現。

## Game 2

1. Host 選 `GAME2_RULES`，然後按 `CREATE BOARDS + START`。這一步會為每位已加入玩家建立 3×3 board。
2. 每次按 `DRAW NEXT`，玩家只可手動標記剛抽到／已抽到的格。當有 10 名（含同秒完成者）完成兩條線後，系統停止接納新完成者。
3. 完成後按 `SETTLE GAME 2`。

## Game 3、Final Choice 與 Reveal

1. Host 選 `GAME3_RULES`，再選 `GAME3_TEAM_SELECT`，讓玩家選隊；宣布贏方後，在 Host 按 BOY 或 GIRL。
2. Host 選 `FINAL_CHOICE`，讓玩家查閱 clues 並提交不可更改的最終預測。
3. 所有頁面準備好後，回到 `secret.html`，輸入密碼後按 `START 5-SECOND REVEAL`。

## 現場注意事項

- 重新整理玩家頁不會遺失他們的 PIN；只有 Admin Reset 才會清空玩家。
- 遲加入的玩家不會補 Game 1 題目；在 Game 2 開始後加入者沒有 Bingo board，應由主持人決定是否重開 Game 2。
- 現階段必須從 GitHub Pages（HTTP/S）測試完整同步；直接用本機 `file://` 開啟只能檢查版面，部分瀏覽器會限制外部 Firebase 連線。
