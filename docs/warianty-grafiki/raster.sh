#!/bin/zsh
S=/private/tmp/claude-501/-Users-przemekplewinski-Claude-Code/8b4514cb-c8e4-4a68-89c6-2b796652762b/scratchpad/raster
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$S/png"
for style in linoryt wycinanka halftone; do
  mkdir -p "$S/png/$style"
  for f in "$S"/svg/$style/*.html; do
    name=$(basename "$f" .html)
    case $name in tiles-*) W=512; H=384;; avatars-*) W=512; H=512;; pawns-*) W=256; H=256;; esac
    "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --default-background-color=00000000 --window-size=$W,$H --screenshot="$S/png/$style/$name.png" "file://$f" >/dev/null 2>&1
  done
done
ls -la "$S"/png/*/ | grep png | wc -l
