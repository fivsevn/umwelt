"""Native Blender shaders for the G-stream molded-plastic handset.

The pattern is projected in local object XY, in the same units as the 4.3 x 7.9
case. Apply mesh scale before assigning it. No image textures are required.
"""

import bpy


# Paint studies adapted from documented natural coloration, not animal skins or
# named captive lines. See handset-references.json for sources and limits.
THEMES = {
    "leopard": {"body": "d7b474", "spot": "514336", "key": "82796a"},
    "tokay": {"body": "91afbf", "spot": "c47757", "key": "bdc99c"},
    "day": {"body": "5a9878", "spot": "af5a4c", "key": "c6c2ab"},
    "crested": {"body": "a28b6c", "spot": "5f5040", "key": "786b5a"},
    "fat-tail": {"body": "ae855d", "spot": "493c32", "key": "cdbf9f"},
    "mossy": {"body": "969d82", "spot": "526b58", "key": "aea993"},
    "electric": {"body": "397da2", "spot": "254753", "key": "b1b4a7"},
    "stone": {"body": "aaa89f", "spot": "65675e", "key": "74776e"},
}


def _linear(value):
    return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4


def _color(hex_value):
    value = hex_value.lstrip("#")
    return tuple(_linear(int(value[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1,)


def _mix(a, b, amount):
    return tuple(x + (y - x) * amount for x, y in zip(a, b))


def _base(name, color, roughness=.5, coat=.08):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    nodes = material.node_tree.nodes
    nodes.clear()
    surface = nodes.new("ShaderNodeBsdfPrincipled")
    surface.name = "Molded plastic"
    surface.inputs["Base Color"].default_value = color
    surface.inputs["Metallic"].default_value = 0
    surface.inputs["Roughness"].default_value = roughness
    surface.inputs["IOR"].default_value = 1.47
    surface.inputs["Specular IOR Level"].default_value = .48
    surface.inputs["Coat Weight"].default_value = coat
    surface.inputs["Coat Roughness"].default_value = .3
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (700, 0)
    surface.location = (450, 0)
    material.node_tree.links.new(surface.outputs["BSDF"], output.inputs["Surface"])
    return material, surface


def _grain(material, surface, roughness, scale=130, strength=.18, distance=.0012,
           spread=.10, age=.075, contact_polish=False, shell_wear=False):
    """Molded ABS with distinct worn, polished and untouched regions.

    Sub-pixel grain stays quiet. Handling and abrasion live on much larger
    regions so their different reflections survive the low-resolution export.
    Pigment patterns remain upstream, with only localized aging over the paint.
    """
    nodes, links = material.node_tree.nodes, material.node_tree.links
    existing = set(nodes)
    coordinates = nodes.new("ShaderNodeTexCoord")
    coordinates.name = "Local plastic and normalized contact coordinates"
    vector = coordinates.outputs["Object"]
    generated = coordinates.outputs["Generated"]

    def ellipse(center, radius, name):
        offset = nodes.new("ShaderNodeVectorMath")
        offset.operation = "SUBTRACT"
        offset.name = name + " position"
        offset.inputs[1].default_value = (*center, 0)
        links.new(generated, offset.inputs[0])
        stretch = nodes.new("ShaderNodeVectorMath")
        stretch.operation = "MULTIPLY"
        stretch.inputs[1].default_value = (1 / radius[0], 1 / radius[1], 0)
        links.new(offset.outputs["Vector"], stretch.inputs[0])
        length = nodes.new("ShaderNodeVectorMath")
        length.operation = "LENGTH"
        links.new(stretch.outputs["Vector"], length.inputs[0])
        return _pattern_ramp(nodes, links, length.outputs["Value"],
                             [(.22, (1, 1, 1, 1)), (1, (0, 0, 0, 1))], name)

    broad, _ = _pattern_noise(nodes, links, vector, 2.6, 2,
                              "Large areas of uneven plastic handling")
    irregular = _pattern_ramp(nodes, links, broad,
                              [(.24, (.25, .25, .25, 1)), (.73, (1, 1, 1, 1))],
                              "Broken contact-zone margins")
    contact = 0
    abrasion = 0
    if shell_wear:
        left = ellipse((.075, .41), (.145, .34), "Left palm contact")
        right = ellipse((.94, .29), (.16, .27), "Right lower grip contact")
        heel = ellipse((.57, .055), (.31, .12), "Pocket-polished heel")
        contact = _pattern_math(nodes, links, "MAXIMUM", left, right)
        contact = _pattern_math(nodes, links, "MAXIMUM", contact, heel)
        contact = _pattern_math(nodes, links, "MULTIPLY", contact, irregular,
                                "Uneven long-term grip polish")
        shoulder = ellipse((.10, .86), (.19, .135), "Broad shoulder abrasion")
        corner = ellipse((.93, .13), (.19, .13), "Heel paint whitening")
        abrasion = _pattern_math(nodes, links, "MAXIMUM", shoulder, corner)
        mottled, _ = _pattern_noise(nodes, links, vector, 6.0, 2,
                                    "Sparse roughened abrasion islands")
        broken = _pattern_ramp(nodes, links, mottled,
                               [(.36, (0, 0, 0, 1)), (.63, (1, 1, 1, 1))])
        abrasion = _pattern_math(nodes, links, "MULTIPLY", abrasion, broken,
                                 "Localized rubbed-white polymer")
    elif contact_polish:
        thumb = ellipse((.46, .53), (.43, .38), "Worn fingertip contact face")
        contact = _pattern_math(nodes, links, "MULTIPLY", thumb, irregular,
                                "Patchy fingertip polish")
        rubbed = ellipse((.23, .30), (.26, .18), "Small fingernail rub")
        abrasion = _pattern_math(nodes, links, "MULTIPLY", rubbed, broad)

    rough = nodes.new("ShaderNodeMapRange")
    rough.name = "Unrubbed ABS roughness variation"
    rough.inputs["From Min"].default_value = .22
    rough.inputs["From Max"].default_value = .78
    rough.inputs["To Min"].default_value = roughness - spread
    rough.inputs["To Max"].default_value = roughness + spread
    links.new(broad, rough.inputs["Value"])
    polish_depth = .21 if shell_wear else .16
    polished = _pattern_math(nodes, links, "MULTIPLY", contact, polish_depth)
    rubbed_roughness = _pattern_math(nodes, links, "SUBTRACT", rough.outputs["Result"], polished)
    abraded_roughness = _pattern_math(nodes, links, "MULTIPLY", abrasion, .16)
    varied_roughness = _pattern_math(nodes, links, "ADD", rubbed_roughness, abraded_roughness)

    # Fine aligned rubbing changes reflection inside contact zones, without
    # putting bright/dark scratches or a uniform noise layer across the shell.
    streak_vector = _pattern_scale(nodes, links, vector, (1.1, 10.0, 1))
    streak, _ = _pattern_noise(nodes, links, streak_vector, 9, 2,
                               "Fine directional contact luster")
    streak = _pattern_math(nodes, links, "SUBTRACT", streak, .5)
    streak = _pattern_math(nodes, links, "MULTIPLY", streak, .10)
    streak = _pattern_math(nodes, links, "MULTIPLY", streak, contact)
    varied_roughness = _pattern_math(nodes, links, "ADD", varied_roughness, streak)
    clamp = nodes.new("ShaderNodeClamp")
    clamp.name = "Plastic reflection stays satin, never wet or stone-matte"
    clamp.inputs["Min"].default_value = .23
    clamp.inputs["Max"].default_value = .77
    links.new(varied_roughness, clamp.inputs["Value"])
    links.new(clamp.outputs["Result"], surface.inputs["Roughness"])

    # The very weak secondary lobe belongs to the polymer finish. Contact adds
    # only a little sheen; whitening loses it instead of becoming a clear coat.
    coat = _pattern_math(nodes, links, "MULTIPLY_ADD", contact, .075)
    coat.node.inputs[2].default_value = .035
    coat_loss = _pattern_math(nodes, links, "MULTIPLY", abrasion, .04)
    coat = _pattern_math(nodes, links, "SUBTRACT", coat, coat_loss)
    links.new(coat, surface.inputs["Coat Weight"])
    coat_roughness = _pattern_math(nodes, links, "MULTIPLY", clamp.outputs["Result"], .72)
    links.new(coat_roughness, surface.inputs["Coat Roughness"])

    grain = nodes.new("ShaderNodeTexNoise")
    grain.name = "Subtle injection-molded micrograin"
    grain.inputs["Scale"].default_value = scale
    grain.inputs["Detail"].default_value = 2
    grain.inputs["Roughness"].default_value = .58
    links.new(vector, grain.inputs["Vector"])
    smooth_strength = _pattern_math(nodes, links, "MULTIPLY_ADD", contact, -strength * .65)
    smooth_strength.node.inputs[2].default_value = strength
    bump = nodes.new("ShaderNodeBump")
    bump.name = "Fine ABS grain softened where handled"
    bump.inputs["Distance"].default_value = distance
    links.new(smooth_strength, bump.inputs["Strength"])
    links.new(grain.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], surface.inputs["Normal"])

    base = surface.inputs["Base Color"]
    if base.is_linked:
        paint = base.links[0].from_socket
    else:
        solid = nodes.new("ShaderNodeRGB")
        solid.name = "Original dyed polymer color"
        solid.outputs["Color"].default_value = base.default_value
        paint = solid.outputs["Color"]
    patina = nodes.new("ShaderNodeMapRange")
    patina.name = "Large gentle pigment age variation"
    patina.inputs["From Min"].default_value = .24
    patina.inputs["From Max"].default_value = .76
    patina.inputs["To Min"].default_value = 1 - age * .5
    patina.inputs["To Max"].default_value = 1 + age * .28
    links.new(broad, patina.inputs["Value"])
    aged = nodes.new("ShaderNodeMixRGB")
    aged.blend_type = "MULTIPLY"
    aged.name = "Subtle fading over the unchanged natural print"
    aged.inputs[0].default_value = 1
    links.new(paint, aged.inputs[1])
    links.new(patina.outputs["Result"], aged.inputs[2])
    oil = nodes.new("ShaderNodeMixRGB")
    oil.blend_type = "MULTIPLY"
    oil.name = "Restrained contact oil tint"
    oil.inputs[2].default_value = (.84, .83, .80, 1)
    links.new(aged.outputs["Color"], oil.inputs[1])
    oil_amount = _pattern_math(nodes, links, "MULTIPLY", contact, .17)
    links.new(oil_amount, oil.inputs[0])
    whitened = _mix(_color("d1cbb9"), material.diffuse_color, .28)
    fade = _pattern_math(nodes, links, "MULTIPLY", abrasion, .22 if shell_wear else .13)
    rubbed = _pattern_mix(nodes, links, fade, oil.outputs["Color"], whitened,
                          "Localized pale abrasion, not all-over desaturation")
    occlusion = nodes.new("ShaderNodeAmbientOcclusion")
    occlusion.name = "Dirt remaining only in actual crevices"
    occlusion.inputs["Distance"].default_value = .055
    occlusion.samples = 8
    if hasattr(occlusion, "only_local"):
        occlusion.only_local = True
    dirt = nodes.new("ShaderNodeMixRGB")
    dirt.blend_type = "MULTIPLY"
    dirt.name = "Small cavity deposits"
    dirt.inputs[0].default_value = .12
    links.new(rubbed, dirt.inputs[1])
    links.new(occlusion.outputs["Color"], dirt.inputs[2])
    links.new(dirt.outputs["Color"], base)
    for index, node in enumerate(n for n in nodes if n not in existing):
        node.location = (-2700 + (index % 10) * 220, -1500 - (index // 10) * 210)


# Sources, life stages, sex-specific colors and design adaptations are recorded
# in handset-references.json. All pigment choices remain plastic paint studies.
def _pattern_input(links, value, socket):
    if isinstance(value, bpy.types.NodeSocket):
        links.new(value, socket)
    else:
        socket.default_value = value


def _pattern_math(nodes, links, operation, first, second=0, name="Paint field"):
    node=nodes.new("ShaderNodeMath");node.operation=operation;node.name=name
    _pattern_input(links,first,node.inputs[0]);_pattern_input(links,second,node.inputs[1])
    return node.outputs[0]


def _pattern_noise(nodes, links, vector, scale, detail=2, name="Organic paint variation"):
    node=nodes.new("ShaderNodeTexNoise");node.name=name
    node.inputs["Scale"].default_value=scale;node.inputs["Detail"].default_value=detail
    node.inputs["Roughness"].default_value=.72
    links.new(vector,node.inputs["Vector"])
    return node.outputs["Fac"],node.outputs["Color"]


def _pattern_ramp(nodes, links, value, stops, name="Pigment boundary"):
    node=nodes.new("ShaderNodeValToRGB");node.name=name;node.color_ramp.interpolation="EASE"
    ramp=node.color_ramp
    ramp.elements.remove(ramp.elements[1])
    for index,(position,color) in enumerate(stops):
        element=ramp.elements[0] if index==0 else ramp.elements.new(position)
        element.position=position;element.color=color
    links.new(value,node.inputs["Fac"])
    return node.outputs["Color"]


def _pattern_mix(nodes, links, factor, first, second, name="Layered paint"):
    node=nodes.new("ShaderNodeMixRGB");node.name=name
    _pattern_input(links,factor,node.inputs[0]);_pattern_input(links,first,node.inputs[1]);_pattern_input(links,second,node.inputs[2])
    return node.outputs["Color"]


def _pattern_scale(nodes, links, vector, scale):
    node=nodes.new("ShaderNodeVectorMath");node.operation="MULTIPLY"
    links.new(vector,node.inputs[0]);node.inputs[1].default_value=scale
    return node.outputs["Vector"]


def _pattern_spots(nodes, links, vector, scale, smallest, largest, irregularity=.10):
    cell=nodes.new("ShaderNodeTexVoronoi");cell.name="Unequal natural spot clusters"
    cell.voronoi_dimensions="2D";cell.feature="F1";cell.inputs["Scale"].default_value=scale
    cell.inputs["Randomness"].default_value=1;links.new(vector,cell.inputs["Vector"])
    separate=nodes.new("ShaderNodeSeparateColor");separate.mode="RGB";links.new(cell.outputs["Color"],separate.inputs["Color"])
    radius=_pattern_math(nodes,links,"MULTIPLY_ADD",separate.outputs[0],largest-smallest,"Variable spot diameter")
    radius.node.inputs[2].default_value=smallest
    grain,_=_pattern_noise(nodes,links,vector,scale*5,2,"Broken spot margins")
    margin=_pattern_math(nodes,links,"SUBTRACT",grain,.5)
    margin=_pattern_math(nodes,links,"MULTIPLY",margin,irregularity)
    distance=_pattern_math(nodes,links,"ADD",cell.outputs["Distance"],margin)
    distance=_pattern_math(nodes,links,"SUBTRACT",distance,radius)
    # Shift the signed field into 0..1 because color-ramp positions are bounded.
    field=_pattern_math(nodes,links,"MULTIPLY_ADD",distance,10)
    field.node.inputs[2].default_value=.5
    return _pattern_ramp(nodes,links,field,[(.32,(1,1,1,1)),(.68,(0,0,0,1))],"Irregular printed spot edge")


def _printed_pattern(material, surface, theme, body, ink):
    nodes,links=material.node_tree.nodes,material.node_tree.links
    first_nodes=set(nodes)
    coordinates=nodes.new("ShaderNodeTexCoord");coordinates.name="Paint in local body coordinates"
    separate=nodes.new("ShaderNodeSeparateXYZ");links.new(coordinates.outputs["Object"],separate.inputs["Vector"])
    planar=nodes.new("ShaderNodeCombineXYZ");links.new(separate.outputs["X"],planar.inputs["X"]);links.new(separate.outputs["Y"],planar.inputs["Y"])
    planar.inputs["Z"].default_value=.173
    vector=planar.outputs["Vector"]
    noise,color=_pattern_noise(nodes,links,vector,3.1,3,"Broad pigment drift")
    center=nodes.new("ShaderNodeVectorMath");center.operation="SUBTRACT";center.inputs[1].default_value=(.5,.5,.5);links.new(color,center.inputs[0])
    warp=nodes.new("ShaderNodeVectorMath");warp.operation="SCALE";warp.inputs["Scale"].default_value=.14;links.new(center.outputs["Vector"],warp.inputs[0])
    distorted=nodes.new("ShaderNodeVectorMath");distorted.operation="ADD";links.new(vector,distorted.inputs[0]);links.new(warp.outputs["Vector"],distorted.inputs[1])
    vector=distorted.outputs["Vector"]
    paint=body
    if theme=="leopard":
        # Unequal eroded clusters and smaller satellite marks form the pigment pattern.
        spots=_pattern_spots(nodes,links,vector,1.95,.075,.185,.18)
        paint=_pattern_mix(nodes,links,spots,body,ink,"Sandy body and dark clusters")
        satellites=_pattern_spots(nodes,links,vector,4.8,.025,.065,.09)
        satellites=_pattern_math(nodes,links,"MULTIPLY",satellites,.72)
        paint=_pattern_mix(nodes,links,satellites,paint,ink,"Small broken satellite spots")
    elif theme=="tokay":
        spots=_pattern_spots(nodes,links,vector,1.75,.075,.155,.13)
        paint=_pattern_mix(nodes,links,spots,body,ink,"Blue-grey and rust orange")
        pale=_pattern_spots(nodes,links,vector,5.5,.025,.060,.06)
        paint=_pattern_mix(nodes,links,pale,paint,_color("d6d1ad"),"Sparse pale tokay scales")
    elif theme=="day":
        stretched=_pattern_scale(nodes,links,vector,(.58,2.35,1))
        patches=_pattern_spots(nodes,links,stretched,1.5,.075,.19,.20)
        paint=_pattern_mix(nodes,links,patches,body,ink,"Uneven red day-gecko marks")
    elif theme=="crested":
        # Thin broken dark markings lie on a warm tan ground.
        phase=_pattern_math(nodes,links,"MULTIPLY",separate.outputs["Y"],5.2)
        drift=_pattern_math(nodes,links,"SUBTRACT",noise,.5)
        drift=_pattern_math(nodes,links,"MULTIPLY",drift,2.8)
        phase=_pattern_math(nodes,links,"ADD",phase,drift)
        phase=_pattern_math(nodes,links,"SINE",phase)
        phase=_pattern_math(nodes,links,"MULTIPLY_ADD",phase,.5)
        phase.node.inputs[2].default_value=.5
        streak=_pattern_ramp(nodes,links,phase,[(.63,(0,0,0,1)),(.87,(1,1,1,1))],"Narrow irregular tiger markings")
        broken,_=_pattern_noise(nodes,links,vector,2.3,2,"Interrupted natural dark markings")
        broken=_pattern_ramp(nodes,links,broken,[(.34,(.25,.25,.25,1)),(.63,(1,1,1,1))])
        streak=_pattern_math(nodes,links,"MULTIPLY",streak,broken)
        paint=_pattern_mix(nodes,links,streak,body,ink,"Tan and umber tiger paint")
        pale=_pattern_ramp(nodes,links,noise,[(.62,(0,0,0,1)),(.80,(.5,.5,.5,1))],"Subtle light tan flecks")
        paint=_pattern_mix(nodes,links,pale,paint,_color("c0aa87"))
    elif theme=="fat-tail":
        phase=_pattern_math(nodes,links,"MULTIPLY",separate.outputs["Y"],3.15)
        drift=_pattern_math(nodes,links,"SUBTRACT",noise,.5)
        drift=_pattern_math(nodes,links,"MULTIPLY",drift,1.4)
        phase=_pattern_math(nodes,links,"ADD",phase,drift)
        phase=_pattern_math(nodes,links,"SINE",phase)
        phase=_pattern_math(nodes,links,"MULTIPLY_ADD",phase,.5)
        phase.node.inputs[2].default_value=.5
        paint=_pattern_ramp(nodes,links,phase,[(.17,ink),(.36,body),(.61,body),(.78,_color("ba9065"))],"Warm natural brown interspaces and dark bands")
        spine=_pattern_math(nodes,links,"MULTIPLY",drift,.035)
        spine=_pattern_math(nodes,links,"ADD",separate.outputs["X"],spine)
        spine=_pattern_math(nodes,links,"ABSOLUTE",spine)
        spine=_pattern_ramp(nodes,links,spine,[(.038,(1,1,1,1)),(.070,(0,0,0,1))],"Narrow ivory dorsal stripe")
        paint=_pattern_mix(nodes,links,spine,paint,_color("ded1b1"))
    elif theme=="mossy":
        cloud,_=_pattern_noise(nodes,links,vector,2.7,4,"Lichen-like mottled paint")
        paint=_pattern_ramp(nodes,links,cloud,[(.30,ink),(.44,body),(.57,_color("b6b198")),(.70,ink)],"Sage, bark and old stone mottling")
        freckle=_pattern_spots(nodes,links,vector,5.0,.02,.060,.10)
        paint=_pattern_mix(nodes,links,freckle,paint,_color("77785f"),"Tiny bark pigment flecks")
    elif theme=="electric":
        # The male's mostly blue body is the main surface; lateral charcoal is
        # broken into short, faint patches so it cannot become a case outline.
        cloud,_=_pattern_noise(nodes,links,vector,1.0,2,"Blue pigment depth")
        paint=_pattern_ramp(nodes,links,cloud,[(.24,_color("326885")),(.76,body)])
        lateral=_pattern_math(nodes,links,"ABSOLUTE",separate.outputs["X"])
        lateral=_pattern_math(nodes,links,"MULTIPLY",lateral,.5)
        lateral=_pattern_ramp(nodes,links,lateral,[(.68,(0,0,0,1)),(.96,(1,1,1,1))])
        broken,_=_pattern_noise(nodes,links,vector,3.3,2,"Interrupted dark lateral pigment")
        broken=_pattern_ramp(nodes,links,broken,[(.48,(0,0,0,1)),(.65,(1,1,1,1))])
        lateral=_pattern_math(nodes,links,"MULTIPLY",lateral,broken)
        lateral=_pattern_math(nodes,links,"MULTIPLY",lateral,.42)
        paint=_pattern_mix(nodes,links,lateral,paint,ink)
    elif theme=="stone":
        # Irregular grey-brown crossbands use Tarentola's natural colour range.
        phase=_pattern_math(nodes,links,"MULTIPLY",separate.outputs["Y"],3.7)
        drift=_pattern_math(nodes,links,"SUBTRACT",noise,.5)
        drift=_pattern_math(nodes,links,"MULTIPLY",drift,2.4)
        phase=_pattern_math(nodes,links,"ADD",phase,drift)
        phase=_pattern_math(nodes,links,"SINE",phase)
        phase=_pattern_math(nodes,links,"MULTIPLY_ADD",phase,.5)
        phase.node.inputs[2].default_value=.5
        bands=_pattern_ramp(nodes,links,phase,[(.61,(0,0,0,1)),(.82,(1,1,1,1))],"Broken grey crossbands")
        broken,_=_pattern_noise(nodes,links,vector,3.9,3,"Irregular rock-grey pigment gaps")
        broken=_pattern_ramp(nodes,links,broken,[(.34,(.18,.18,.18,1)),(.59,(1,1,1,1))])
        bands=_pattern_math(nodes,links,"MULTIPLY",bands,broken)
        paint=_pattern_mix(nodes,links,bands,body,ink,"Warm stone ground and dark grey bands")
        flecks=_pattern_spots(nodes,links,vector,6.3,.018,.045,.075)
        paint=_pattern_mix(nodes,links,flecks,paint,_color("c8c4b6"),"Sparse light stone flecks")
    _pattern_input(links,paint,surface.inputs["Base Color"])
    for index,node in enumerate(n for n in nodes if n not in first_nodes):
        node.location=(-2200+(index%8)*225,1000-(index//8)*210)


def make_materials(theme="tokay"):
    """Return named, Eevee/Cycles-compatible plastic and contact materials."""
    theme = theme if theme in THEMES else "tokay"
    settings = THEMES[theme]
    body_color, ink_color, key_color = (_color(settings[name]) for name in ("body", "spot", "key"))

    body, body_surface = _base(f"{theme} aged ABS shell", body_color, .47, .055)
    body_surface.inputs["Coat Roughness"].default_value = .31
    body_surface.inputs["Specular IOR Level"].default_value = .48
    _printed_pattern(body, body_surface, theme, body_color, ink_color)
    _grain(body, body_surface, .47, scale=145, strength=.18, distance=.0012, spread=.11, age=.14, shell_wear=True)

    key, key_surface = _base(f"{theme} worn key plastic", key_color, .43, .055)
    key_surface.inputs["Coat Roughness"].default_value = .29
    key_surface.inputs["Specular IOR Level"].default_value = .47
    _grain(key, key_surface, .43, scale=160, strength=.15, distance=.0010, spread=.085, age=.08, contact_polish=True)
    tray_color = _mix(key_color, _color("222923"), .42)
    tray, tray_surface = _base(f"{theme} recessed key bed", tray_color, .54, .025)
    _grain(tray, tray_surface, .59, scale=155, strength=.12, distance=.0008, spread=.07, age=.06)
    gasket, _ = _base("Soft charcoal contact gasket", _color("141b1c"), .68, 0)
    bezel, _ = _base("Dark glass edge", _color("18272c"), .24, .2)
    wear_dark, _ = _base("Exposed dark plastic cuts", _color("292d29"), .78, 0)
    wear_light, _ = _base("Rubbed pale polymer", _mix(_color("b7b9ad"), body_color, .20), .57, 0)
    glass, glass_surface = _base("Polished edge reflection", _color("768a8f"), .12, .3)
    glass_surface.inputs["IOR"].default_value = 1.5
    return {
        "body": body, "key": key, "tray": tray, "gasket": gasket,
        "bezel": bezel, "glass": glass, "wear_dark": wear_dark,
        "wear_light": wear_light,
    }
