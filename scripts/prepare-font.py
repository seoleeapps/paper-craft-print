"""Run in a venv with fonttools. Keep the licensed, static font reproducible."""
from pathlib import Path
from urllib.request import urlopen
from fontTools.ttLib import TTFont
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
from io import BytesIO
root=Path(__file__).resolve().parents[1]/'apps/mobile/assets/fonts'
source=urlopen('https://raw.githubusercontent.com/google/fonts/4efc2774c63917927efe769ca845def6bd6debae/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf').read()
font=instantiateVariableFont(TTFont(BytesIO(source)),{'wght':400},inplace=True)
# PDF-lib does not retain all glyph substitutions during embedding. Map each
# supported Unicode character directly; this product does not support shaping scripts.
for tag in ['GSUB','GPOS']:
    if tag in font: del font[tag]
options=subset.Options();options.layout_features=[]
sub=subset.Subsetter(options=options)
sub.populate(unicodes=list(range(0x20,0x250))+list(range(0x1100,0x1200))+list(range(0x2000,0x2800))+list(range(0x3000,0x3040))+list(range(0x3130,0x3190))+list(range(0xac00,0xd7a4)))
sub.subset(font)
font.save(root/'CraftSans.ttf')
