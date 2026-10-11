"""Pack/export/check the completed 02 native colour atlases.

Exports into temporary staging first. Replaces only the two runtime colour
PNGs and manifest after exact binary/mask/part checks, then independently
reopens the saved Blender source. Original 01/07 assets remain untouched.
"""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import tempfile

HERE=Path(__file__).resolve().parent
RUNTIME=HERE.parents[2]/'rooftop/assets/background'
BLENDER='/Applications/Blender.app/Contents/MacOS/Blender'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def manifest(path):
    text=path.read_text()
    return json.loads(text.split('Object.freeze(',1)[1].rsplit(');',1)[0])


def run(script, *args):
    command=[BLENDER,'--background','--python-exit-code','1','--python',str(HERE/script)]
    if args:
        command.extend(['--',*[str(arg)for arg in args]])
    result=subprocess.run(command,capture_output=True,text=True,timeout=300)
    (HERE/(script.removesuffix('.py')+'.log')).write_text(result.stdout+'\n'+result.stderr)
    assert result.returncode==0, script+' failed; inspect its saved log'
    print('Blender completed: '+script,flush=True)


def main():
    for name in ['pixelorama-scope-check.json','pixelorama-distant-scope-check.json']:
        proof=json.loads((HERE/name).read_text())
        assert proof['nativePxoReopened'] and proof['nativeCelEqualsPngAndReopenedPng']
    baseline=json.loads((HERE/'integration-baseline.json').read_text())
    assert digest(RUNTIME/'empty-rooftop.bin')==baseline['runtimeBinarySha256']
    assert digest(RUNTIME/'empty-rooftop.mjs')==baseline['runtimeManifestSha256'], 'Do not overwrite an independently revised runtime manifest'
    run('replace-atlas.py')
    with tempfile.TemporaryDirectory(prefix='rooftop-lowpoly-02-export-') as directory:
        staging=Path(directory)
        run('export-game.py',HERE/'game-environment.blend',staging)
        old=baseline['runtimeManifest']
        current=manifest(staging/'empty-rooftop.mjs')
        expected=json.loads(json.dumps(old))
        expected['source']='docs/art/rooftop-lowpoly-02/game-environment.blend'
        expected['textureSha256']=digest(HERE/'terrace-book.png')
        for texture in expected['textures']:
            if texture['file'] in ['terrace-book.png','distance-facades.png']:
                texture['sha256']=digest(HERE/texture['file'])
                texture['bytes']=(HERE/texture['file']).stat().st_size
        assert current==expected, 'Export manifest changed beyond source and colour identities'
        assert (staging/'empty-rooftop.bin').read_bytes()==(HERE/'before-empty-rooftop.bin').read_bytes()
        assert (staging/'distance-lights.png').read_bytes()==(HERE/'before-distance-lights.png').read_bytes()
        for name in ['terrace-book.png','distance-facades.png']:
            assert (staging/name).read_bytes()==(HERE/name).read_bytes()
            shutil.copyfile(staging/name,RUNTIME/name)
        shutil.copyfile(staging/'empty-rooftop.mjs',RUNTIME/'empty-rooftop.mjs')
    run('check-native.py')
    run('audit-material-coverage.py',HERE/'game-environment.blend',HERE/'material-coverage-final.json')
    original=HERE.parent/'rooftop-lowpoly-01'
    protected={
        'game-environment.blend':baseline['nativeSha256'],
        'terrace-book.png':baseline['pixeloramaPngSha256'],
        'terrace-book.pxo':baseline['pixeloramaPxoSha256'],
        'distance-facades.png':baseline['distantRuntimeSha256']['distance-facades.png'],
        'distance-facades.pxo':baseline['farPixeloramaPxoSha256'],
    }
    assert all(digest(original/name)==expected for name,expected in protected.items())
    assert digest(HERE.parent/'rooftop-weathering-07/game-environment.blend')==baseline['original07NativeSha256']
    main_proof=json.loads((HERE/'pixelorama-scope-check.json').read_text())
    far_proof=json.loads((HERE/'pixelorama-distant-scope-check.json').read_text())
    blend=json.loads((HERE/'native-source-check.json').read_text())
    report={
        'nativePixeloramaMainSavedAndReopened':True,'nativePixeloramaFarSavedAndReopened':True,
        'nativeBlenderSavedExportedAndReopened':True,
        'original01SourcesPreserved':True,'original07NativePreserved':True,
        'allSourceVerticesNormalsUvsTransformsMaterialsCamerasAndLightsExactlyPreserved':True,
        'alsoExactlyMatchesOriginal07':blend['alsoExactlyMatchesOriginalWeathering07'],
        'mainDimensions':[1024,1024],'farDimensions':[2048,2048],
        'mainChangedPixelsFrom01':main_proof['changedPixels'],
        'farChangedPixelsFrom01':far_proof['changedPixels'],
        'mainNativePencilStrokes':main_proof['nativePencilStrokes'],
        'farNativePencilStrokes':far_proof['nativePencilStrokes'],
        'farRgbColors':far_proof['rgbColorCountExcludingTransparent'],
        'alphaPaddingAndErasedSignsPreserved':True,'lightMaskByteIdentical':True,
        'texelsPerMetre':16,'runtimeParts':blend['runtimePartCount'],
        'runtimePartsSha256':blend['runtimePartsSha256'],
        'runtimeBinarySha256':blend['runtimeBinarySha256'],
        'nativeBlendSha256':blend['savedSourceSha256'],
        'mainPngSha256':main_proof['pngSha256'],'farPngSha256':far_proof['pngSha256'],
        'runtimeSource':'docs/art/rooftop-lowpoly-02/game-environment.blend',
        'warnings':'Pixelorama headless Godot Dummy renderer shader and exit-resource warnings recorded in native logs. Independent source reopen and byte checks passed. Blender operations completed successfully; inspect logs for diagnostics.',
        'released':False,
    }
    (HERE/'native-final-check.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True)


if __name__=='__main__':
    main()
