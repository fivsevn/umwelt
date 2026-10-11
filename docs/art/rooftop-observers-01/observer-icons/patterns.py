import json
from pathlib import Path
GLYPHS=json.loads((Path(__file__).parent/"glyphs.json").read_text())
PALETTE={"B":"#364638","P":"#d8d1b2","G":"#849572","W":"#e1dec5","Y":"#bc9d61","D":"#574b3b"}
def pattern_color(field,point,base):
 x=int(point[0]*16);y=int(point[1]*16)
 if 0<=x<16 and 0<=y<16:return PALETTE.get(GLYPHS[field["component"]][y][x],base)
 return base
