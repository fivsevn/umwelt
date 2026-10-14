"""Refresh the current 2px / 96-colour cabin after an environment render."""
from PIL import Image
import numpy as np

def refresh_background(root):
    im=Image.open(root/'renders/cabin.png').convert('RGB').resize((180,320),Image.Resampling.LANCZOS)
    palette=im.quantize(colors=96,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    lookup=np.asarray(palette.getpalette(),dtype=np.float32).reshape((-1,3))[:96]
    work=np.asarray(im,dtype=np.float32).copy();out=np.empty_like(work,dtype=np.uint8)
    for y in range(320):
        direction=1 if y%2==0 else -1
        for x in range(180) if direction==1 else range(179,-1,-1):
            value=np.clip(work[y,x],0,255);colour=lookup[np.argmin(np.sum((lookup-value)**2,axis=1))]
            out[y,x]=colour;error=(value-colour)*.45
            for dx,dy,weight in [(direction,0,7/16),(-direction,1,3/16),(0,1,5/16),(direction,1,1/16)]:
                xx=x+dx;yy=y+dy
                if 0<=xx<180 and yy<320:work[yy,xx]+=error*weight
    result=Image.fromarray(out).resize((360,640),Image.Resampling.NEAREST)
    result.save(root.parents[2]/'ophidia/assets/cabin.webp',format='WEBP',lossless=True,method=6)
    return result
