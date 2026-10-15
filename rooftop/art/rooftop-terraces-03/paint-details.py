"""Use the maintained native Pixelorama Pencil authoring tool on this family only."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
shared=HERE.parent/'rooftop-furniture-02/paint-native.py'
source=shared.read_text().replace('ROOT=Path(__file__).resolve().parent','ROOT=Path('+repr(str(HERE))+')').replace("NAME='UmweltFurnitureAuthor02'","NAME='UmweltTerraceDetail03'")
sys.argv=[str(shared),'terraces']+sys.argv[1:]
exec(compile(source,str(shared),'exec'),{'__file__':str(shared),'__name__':'__main__'})
