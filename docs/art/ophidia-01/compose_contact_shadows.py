"""Combine two native Blender passes with genuine booth contact shadows.

Keep the isolated portrait's clear RGBA edge. Extract receiver opacity from
the native Combined catcher pass, then suppress only faint sampling residue
in the shadow, never in the portrait. Both original native passes are retained.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

def compose(root,poses=('normal','curious','away','tongue')):
    report={'method':'Two native Cycles passes; shadow opacity from real seat/backrest catcher alpha; clear animal RGBA over black receiver attenuation',
        'painted_shadow':False,'screen_space_ellipse':False,
        'shadow_noise_gate_alpha':[.055,.085],
        'portrait_alpha_thresholded':False,'poses':{}}
    for pose in poses:
        portrait=Image.open(root/'renders'/f'snake-{pose}-portrait.png').convert('RGBA')
        combined=Image.open(root/'renders'/f'snake-{pose}-receivers.png').convert('RGBA')
        assert portrait.size==combined.size==(720,1280)
        a=np.asarray(portrait)[:,:,3].astype(np.float32)/255
        b=np.asarray(combined)[:,:,3].astype(np.float32)/255
        shadow=np.maximum(0,b-a)/np.maximum(1-a,1e-5)
        shadow[a>.96]=0
        gate=np.clip((shadow-.055)/.030,0,1)
        gate=gate*gate*(3-2*gate)
        shadow=np.clip(shadow*gate,0,1)
        rgba=np.zeros((1280,720,4),np.uint8);rgba[:,:,3]=np.round(shadow*255).astype(np.uint8)
        layer=Image.fromarray(rgba)
        layer.save(root/'renders'/f'snake-{pose}-contact-shadow.png')
        final=Image.alpha_composite(layer,portrait)
        table=Image.open(root/'renders/foreground-table-matte.png').convert('RGBA').getchannel('A')
        assert table.size==(180,320)
        table=table.resize((720,1280),Image.Resampling.NEAREST)
        original=np.asarray(final.getchannel('A')).astype(np.float32)
        coverage=np.asarray(table).astype(np.float32)/255
        occluded=np.round(original*(1-coverage)).astype(np.uint8)
        # Match the real frozen table's 2px boundary, rather than a guessed
        # horizontal crop. The entire original background remains untouched.
        final.putalpha(Image.fromarray(occluded))
        final.save(root/'renders'/f'snake-{pose}.png')
        report['poses'][pose]={'native_shadow_bounds_xy':layer.getchannel('A').getbbox(),
            'shadow_visible_pixels':int(np.count_nonzero(rgba[:,:,3])),
            'shadow_alpha_max':int(rgba[:,:,3].max()),
            'portrait_alpha_bounds_xy':portrait.getchannel('A').getbbox(),
            'final_alpha_bounds_xy':final.getchannel('A').getbbox(),
            'table_occluded_pixels':int(np.count_nonzero((original>0)&(coverage>.5))),
            'table_occluded_portrait_pixels':int(np.count_nonzero((a>.063)&(coverage>.5))),
            'clear_upper_frame_alpha_max':int(np.asarray(final)[:450,:,3].max()),
            'clear_window_alpha_max':int(np.asarray(final)[:800,540:,3].max())}
    (root/'contact-shadow-composite.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report

if __name__=='__main__':compose(Path(__file__).resolve().parent)
