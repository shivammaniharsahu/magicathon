# 📸 Shot List for the README

Capture these 8 screenshots + 1 short video and drop them into the matching paths.
The README already references each one — no need to edit it after.

**Resolution**: capture at 1440×900 or higher. The README displays each at a fixed width via the `<img>` tags, so over-capturing is fine; the browser/GitHub scales down.

**Theme**: dark mode (the app forces it). Hide your bookmarks bar and any sensitive extension icons before capturing.

---

## 1. `01-hero.png` — Landing page hero

- **URL**: `/` (https://magicathon-silk.vercel.app/ or http://localhost:3000)
- **Capture**: the visible viewport at the top of the page. The hero text *"Post anything. Make everyone laugh."* should be centered and visible. The floating emoji badges should be in the frame.
- **Tip**: scroll back to the top before capturing. The "Live · the internet's happiest place" chip above the headline should be visible.

## 2. `02-feed.png` — Feed with the Daily Trending card

- **URL**: `/feed`
- **Capture**: the top of the feed showing **the entire Daily Trending card** (the amber-bordered card with the AI-generated meme on the left and the description on the right). Include the Feed Tabs (For You / Roast Me / etc.) just below it so the context is obvious.
- **Tip**: refresh the page first so the trending meme has actually rendered. If the image is still loading, wait 10s.

## 3. `03-meme-studio.png` — AI Meme Studio in action

- **URL**: open from any page → click **Post** in the navbar → click **Meme it** in the action row.
- **Capture**: the full Meme Studio dialog. Pre-populate:
  - Type something like *"a goblin hoarding coffee mugs at 3am, photo-real"* in the prompt
  - Click **Generate** so a real AI image is on the canvas
  - Click **Caption** so top + bottom text appears on the image
  - Optionally drag one text block to a non-default spot (shows positional editing)
- **What should be visible**:
  - The image on the canvas
  - Both text blocks visible on the canvas
  - The right column with Background panel + Describe panel + variant tiles + Animation picker
  - The amber **🔥 Cook me a trending meme** card below the canvas

## 4. `04-cartoonify-before.png` and `04-cartoonify-after.png` — Before / After cartoonify

- **URL**: same Meme Studio
- **Step 1 (before)**: click **Selfie** → snap a photo → wait for canvas to load → capture the **canvas only** (the left half of the dialog). Don't include the controls. Crop tightly.
- **Step 2 (after)**: still in the same Meme Studio, pick **Pixar** style in the Cartoonify dropdown → click **Cartoonify this image** → wait 10-15s → once the cartoon version loads, capture the **canvas only** again at the same crop dimensions.
- **Tip**: use a clean, well-lit photo for the best demo. The two captures should be the same crop so the side-by-side comparison is impactful.

## 5. `05-coach.png` — Funny Coach reading a draft

- **URL**: click **Post** in the navbar
- **Capture**: the Create Post dialog with a partial draft typed out — pick something with personality, like:
  - *"my therapist said to set boundaries so i blocked my landlord"* (this scores high)
  - or *"work is hard today lol"* (this scores low — also a great demo to show the AI is critical, not flattering)
- **What should be visible**: the entire Funny Coach card right under the textarea: the meter, the score number, the label (FIRE / RAW / VAGUE), and the tip. Make sure the tip is non-empty.
- **Tip**: capture in two states if you want — one with a "lazy" draft (vague label, score ~30) and one with a sharp draft (fire/gold label, score 75+). Pick the more impressive one for the README.

## 6. `06-meme-battle.png` — Meme Battle mid-vote

- **URL**: `/feed`
- **Step**: scroll to the Meme Battle widget (below the Daily Trending card)
- **Capture**: a frame **right after you've clicked "This one"** — the winner should be glowing with the amber Crown badge, the loser should be dimmed with the skull. The "AI agrees" or "AI disagrees" verdict chip should be visible at the bottom.
- **Tip**: practice the click timing. The reveal animation lasts ~1.6s before the next pair loads. You want to capture during that 1.6s window. Use your OS screenshot tool's countdown / delay mode (Cmd+Shift+5 on Mac → Options → 10-second delay).

## 7. `07-trending-cta.png` — Amber Trending button (optional, can skip if space-constrained)

- Same Meme Studio. Capture just the bottom-left of the dialog showing the amber **🔥 Hot right now / ZERO EFFORT / Cook me a trending meme** card. This visually proves the trending CTA is differentiated.

## 8. `08-text-edit.png` — Inline canvas text editor

- Same Meme Studio. Generate an image. Click on one of the text blocks on the canvas to open the floating textarea editor. Capture **just the canvas** with the editor open over a text block. The hint *"enter to save · esc to cancel"* should be visible under the textarea.

---

## 🎥 Demo video — `docs/videos/demo.mp4`

**Length**: 60-90 seconds. Anything longer loses judges.

**Suggested script** (record with QuickTime / Loom / OBS):

1. **0-5s** — Open `/` → quick pan over the landing hero
2. **5-15s** — Click **Enter the chaos** → land on `/feed` → point at the Daily Trending card → scroll past it
3. **15-30s** — Click 😂 on a post → confetti + count bumps. Click **This one** in the Meme Battle → winner highlight + AI verdict appears
4. **30-50s** — Click **Post** → type a quick draft → coach animates score live → click **Meme it**
5. **50-75s** — In the studio, click **Selfie** → snap → click **Cartoonify this image** with Pixar style → wait for the cartoon to render → click **Caption** → drag a text block → pick **Bounce** animation
6. **75-90s** — Click **Attach to post → Post it!** → land back on `/feed` showing the new meme with the bounce animation playing in-feed

**How to embed in the README** (after you record):

The README has a placeholder line that looks like:
```
https://github.com/shivammaniharsahu/magicathon/assets/REPLACE_WITH_VIDEO_URL_AFTER_DRAG_DROP/demo.mp4
```

The cleanest path:
1. Open the README on github.com (https://github.com/shivammaniharsahu/magicathon/blob/main/README.md → pencil icon to edit)
2. Drag your `demo.mp4` file into the editor
3. GitHub uploads it and inserts a URL like `https://github.com/user-attachments/assets/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
4. Replace the placeholder line with that URL
5. Commit the change

GitHub will render the video inline with native controls.

**Alternative** — convert the video to a GIF (3-5 second loop of the punchiest moment, e.g. the cartoonify reveal) and commit as `docs/videos/demo.gif`. Then change the README line to:
```markdown
<img src="docs/videos/demo.gif" width="900" alt="Demo" />
```

GIFs are bigger filesize-wise but work anywhere and don't need a re-upload to GitHub's CDN.

---

## ⚡ Quickest path (15 minutes total)

If you're short on time:

1. **Hero shot** (`01-hero.png`) — 30s
2. **Feed with Daily Trending** (`02-feed.png`) — 1m
3. **Meme Studio** (`03-meme-studio.png`) — 3m (generating an image takes longest)
4. **Cartoonify before/after** (`04-cartoonify-before/after.png`) — 3m
5. **Funny Coach** (`05-coach.png`) — 1m
6. **Meme Battle** (`06-meme-battle.png`) — 1m (one delayed screenshot)
7. **GIF of cartoonify reveal** — 5m (record screen, trim to 5s, convert via [ezgif.com](https://ezgif.com))

Drag everything into the GitHub README editor, save, done.
