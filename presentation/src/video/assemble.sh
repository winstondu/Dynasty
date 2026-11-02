#!/bin/zsh
# Pairs slides/slide-NN.png with audio/NN.wav (normalized to -16 LUFS, 0.6s lead-in, 1.2s hold after) and joins them into Dynasty.mp4.
set -e
cd "$(dirname "$0")"
rm -rf seg; mkdir seg; : > seg/list.txt
for wav in audio/*.wav; do
  n=$(basename $wav .wav)
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $wav)
  total=$(python3 -c "print($dur + 1.8)")
  ffmpeg -v error -y -loop 1 -framerate 30 -i slides/slide-$n.png -i $wav \
    -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,adelay=600|600,apad[a]" -map 0:v -map "[a]" -t $total \
    -c:v libx264 -tune stillimage -preset slow -crf 18 -pix_fmt yuv420p -r 30 \
    -c:a aac -b:a 192k -ar 48000 -ac 2 seg/$n.mp4
  echo "file '$n.mp4'" >> seg/list.txt
done
ffmpeg -v error -y -f concat -safe 0 -i seg/list.txt -c copy -movflags +faststart Dynasty.mp4
ffprobe -v error -show_entries format=duration,size -of default=nw=1 Dynasty.mp4
