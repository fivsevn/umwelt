"""Exercise the exporter geometry guard without opening or changing a model."""
import ast,math
from pathlib import Path
tree=ast.parse(Path(__file__).with_name('export-game.py').read_text())
functions=ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name in {'is_affine_box','canonical_cube_values'}],type_ignores=[])
scope={'math':math};exec(compile(functions,'export-game.py','exec'),scope)
check=scope['is_affine_box']
cube=[(-.5,-.5,-.5),(.5,-.5,-.5),(.5,.5,-.5),(-.5,.5,-.5),(-.5,-.5,.5),(.5,-.5,.5),(.5,.5,.5),(-.5,.5,.5)]
faces=[(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
assert check(cube,faces)
shear=[(120+x*7+y*.8,-34+y*3,z*2+x*.15)for x,y,z in cube]
assert check(shear,faces),'Actual affine cubes retain rotation and shear'
roof=[list(v)for v in cube];roof[6][0]-=.3;roof[7][0]+=.3
assert not check(roof,faces),'Eight vertices do not make a pitched roof a cube'
assert not check(cube,faces[:-1]),'Missing sides require native mesh export'
assert not check(cube,faces[:-1]+[(0,1,2,4)]),'A different face topology is not a cube'
data=scope['canonical_cube_values']()
assert len(data)==36*8 and all(math.isfinite(n)for n in data)
for at in range(0,len(data),24):
 a,b,c=[data[at+i:at+i+3]for i in (0,8,16)];u=[b[i]-a[i]for i in range(3)];v=[c[i]-a[i]for i in range(3)]
 n=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
 assert list(n)==data[at+3:at+6],'Cube faces retain outward winding and normals'
print('Exporter geometry: affine cubes, sheared cubes, pitched roofs, face topology and outward normals verified')
