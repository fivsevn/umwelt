"""Clear head-focused Galgame portrait; current background is byte-stable.

The background keeps its existing 2px / 96-color rendering and depth of field.
Four 720x1280 lightly focused Blender character passes become a shared 256-color 1px
portrait layer. Native mild optical blur is confined to the character. No runtime CSS blur or
sharpening of the defocused body is used.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json

POSES=['normal','curious','away','tongue']

def process_portraits(root):
    background=Image.open(root.parents[2]/'ophidia/assets/cabin.webp').convert('RGBA')
    raw=[];samples=[]
    for pose in POSES:
        im=Image.open(root/'renders'/('snake-'+pose+'.png')).convert('RGBA')
        assert im.size==(720,1280), (pose,im.size)
        # RGBA resampling in Pillow handles premultiplied alpha, preventing
        # dark edge halos around the sharp transparent silhouette.
        im=im.resize((360,640),Image.Resampling.LANCZOS)
        # Keep the native lens falloff; do not sharpen the softly defocused
        # rear coil back into the same plane as the clear face and clothing.
        rgb=im.convert('RGB')
        alpha=im.getchannel('A');a=np.asarray(rgb);mask=np.asarray(alpha)>170
        samples.append(a[mask]);raw.append((rgb,alpha))
    pool=np.concatenate(samples)
    palette=Image.fromarray(pool.reshape((-1,1,3)).astype(np.uint8)).quantize(colors=256,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    layers=[]
    for rgb,alpha in raw:
        layer=rgb.quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');layer.putalpha(alpha);layers.append(layer)
    frames=[Image.alpha_composite(background,layer) for layer in layers]
    report={'selected':'head-focused-close-character-over-preserved-pixel-depth','output':[360,640],
      'background':{'native_grid':[180,320],'pixel_size':2,'colors':96,'native_dof':True,'focus_distance':2.12,'fstop':2.0,'existing_background_bytes_preserved':True},
      'foreground':{'raw_grid':[720,1280],'native_grid':[360,640],'pixel_size':1,'shared_palette_colors':256,'diffusion':0,'native_dof':True,'fstop':2.8,'per_pose_head_focus':True,'unsharp_percent':0},
      'all_four_poses_share_character_palette':True,'projection_matches_background':False,'foreground_camera_push_m':.10,'runtime_css_blur':False}
    metadata=root/'portrait-layer-render.json'
    if metadata.exists():
        native=json.loads(metadata.read_text())
        report['foreground']['focus_axial_depth_m']=native.get('foreground_focus_axial_depth_m',{})
        report['character_presentation_scale']=native.get('character_presentation_scale')
        report['character_translation']=native.get('character_translation')
        report['native_contact_shadows']=native.get('native_contact_shadows')
    return background,layers,frames,report
