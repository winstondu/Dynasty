#!/bin/zsh
set -e
B="$(cd "$(dirname "$0")" && pwd)"; cd "$B"
export PPTX_SKILL="/Users/winstondu/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/922ce79b-4c35-40c4-a4fb-67aa963f1318/3f21ff12-a860-4614-a0dd-b0382d934d84/skills/pptx" NODE_PATH="$B/node_modules"
node build.js Dynasty.pptx
python3 "$PPTX_SKILL/scripts/office/validate.py" Dynasty.pptx
rm -rf render; mkdir render
osascript -e "tell application \"Keynote\"
 set d to open POSIX file \"$B/Dynasty.pptx\"
 delay 2
 export d to POSIX file \"$B/render\" as slide images with properties {image format:JPEG, skipped slides:false}
 close d saving no
end tell"
python3 -I -c "
from PIL import Image;import glob
fs=sorted(glob.glob('render/*.jpeg'))
for k in range(0,len(fs),6):
  ims=[Image.open(f) for f in fs[k:k+6]];w,h=ims[0].size
  g=Image.new('RGB',(w*2,h*3),'white')
  for i,im in enumerate(ims): g.paste(im,((i%2)*w,(i//2)*h))
  g.save(f'grid{k//6}.jpg',quality=85)
"
