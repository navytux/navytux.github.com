#!/bin/bash -x
# *.jpeg -> *.jpg   *.webp  -> *.jpg  ...

find . -iname '*.jpeg' -exec sh -c 'x="{}"; mv "$x" "${x%.jpeg}.jpg"' ';'
find . -iname '*.webp' -exec sh -c 'x="{}"; mv "$x" "${x%.webp}.jpg"' ';'
find . -iname '*.png'  -exec sh -c 'x="{}"; mv "$x" "${x%.png}.jpg"' ';'
