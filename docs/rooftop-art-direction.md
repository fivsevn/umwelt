# Rooftop object art direction

The approved direction is the first supplied reference (IMG_2252): neighbouring olive, khaki and earthy colour clusters, visible material planes, and dark occlusion inside foliage. Reference images guide technique only; do not copy their compositions or artwork.

- During plant/pot palette work, keep the rooftop, city and garage backgrounds unchanged. The later weather brief explicitly authorizes sky, city detail, surface repairs, rust and a small corner drain. Preserve the base palette and intact architecture while adding these features.
- Block in silhouettes with the material midtone. Do not wrap leaves, cactus pads, pots or furniture in a continuous dark contour.
- Shift hue across each ramp: warmer muted highlights, cooler/olive shadows. Retain plant-specific blue, burgundy and flower colours.
- Separate overlapping leaves with small connected shadow planes. Give neighbouring leaves different values according to their position.
- Use a few interlocking pixel clusters at face transitions; do not cover objects with checkerboard dithering or random noise.
- Pots keep their researched profiles and dark default terracotta. Rims catch limited light; they should not become a bright enclosing band.
- Furniture uses side planes, wood grain, slat gaps and joints to describe volume.
- Artwork is transparent; the screen-space contact shadow stays small and underneath when rotated.
- Retain short notebook notes and the actual references, including the selected container references.

## Technique references consulted

- [cure: Pixel Art Tutorial](https://pixeljoint.com/forum/forum_posts.asp?TID=11299): clusters, selective dithering, avoiding noise and pillow shading.
- [Raymond Schlitter: Pixelblog 1 — Color Palettes](https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes): hue shifts, saturation and relative contrast within colour ramps.

Botanical observations are grounded in the source links stored on each plant profile. This revision also checks the jade plant, spearmint and Boston fern against their NC State Extension profiles.

## Weather (2026-10-01)

The garage offers seven weather conditions and five time phases plus automatic options. Its choice persists separately from the layout. The public scene selects weather independently at entry and changes gently every eight minutes; its time phase follows the local device clock. These are ambient simulations, not live forecasts.

Foliage and vessels are separate cached layers. Wind shifts only foliage in integer pixel groups; succulents stay substantially rigid. Rain falls down the screen in both native map layouts; ripples and wet surface marks follow the roof. Night lights reuse deterministic room samples so late-night lights are a subset of early-night lights.

The first weather pass was rejected because a full-frame tint flattened values. The revised renderer leaves the sky on its own layer and recolours opaque material pixels with light/shadow ramps. No whole-scene dark or fog veil is used. Sunset has coherent warm receiving planes, cool shade, and longer object/rail shadows. Rain accumulates in irregular roof puddles, with clipped object reflections, ripples, crown splashes and runnels near the grate; water persists briefly after the weather clears.

Plants carry a persistent unsigned 32-bit seed. New additions and copies get their own seed; existing plants derive a stable seed from their id during import. Pixel-grid growth varies foliage width, height, lean, leaf-cluster positions and restrained tonal detail without changing vessel geometry. Both the static sprite and foliage animation caches include the seed; movement, repotting, reload and export/import preserve the individual. Catalog previews remain fixed specimens.

## 物件转向（2026-10-01）

转向表示绕竖直轴改变朝向，观看方向固定。家具、柜子、水槽等分别绘制正面、两侧和背面；支脚、立柱、龙头始终沿画面竖直方向。柜子背板、椅背外侧、温湿度表后壳与园艺土袋背面不沿用正面细节。圆桌、圆盆等对称物件保持直立，地面的毛巾与工具按平面旋转。植物暂时沿用原来的绘制。全部使用代码生成像素，不增加图片素材。

`rooftop/facing.mjs` 管理方向投影与绘制范围，`objects.mjs` 管理小物背面与灯具方向。点击区域及选择框采用对应视图的显示范围；旧布局的坐标、占地和承托规则保持兼容。灯光跟随灯头与灯泡的位置。

方向回归：`tests/browser/rooftop-facing.cjs` 检查四面水槽、竖直支脚、独立缓存、后壳、侧面晾衣架选中及保存恢复；与扩容回归一并在 Chromium 和 WebKit 验证。
