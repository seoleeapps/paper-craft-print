from PIL import Image,ImageDraw
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'apps/mobile/assets'
for name,size,transparent in [('icon.png',1024,False),('adaptive-icon.png',1024,True),('splash-icon.png',512,True)]:
    image=Image.new('RGBA',(size,size),(250,247,240,0 if transparent else 255))
    d=ImageDraw.Draw(image);s=size/1024
    pts=lambda p:[(int(x*s),int(y*s)) for x,y in p]
    d.rounded_rectangle((int(230*s),int(310*s),int(794*s),int(720*s)),radius=int(45*s),fill='#2e5b48')
    d.polygon(pts([(255,345),(512,535),(769,345)]),fill='#ece5d7')
    d.line(pts([(256,677),(438,499)]),fill='#faf7f0',width=int(8*s))
    d.line(pts([(768,677),(586,499)]),fill='#faf7f0',width=int(8*s))
    d.ellipse((int(660*s),int(234*s),int(747*s),int(321*s)),fill='#d79a62')
    image.save(root/name)
