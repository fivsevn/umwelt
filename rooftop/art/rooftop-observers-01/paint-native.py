"""ROOT-only native Pixelorama entry, reusing the verified Pencil pipeline."""
from pathlib import Path
common=Path(__file__).resolve().parent.parent/'rooftop-furniture-02'/'paint-native.py'
# The shared painter resolves all output through __file__. Its code and actual
# native Pencil/reopen checks run unchanged against this new artifact directory.
exec(compile(common.read_text(),str(common),'exec'),{'__file__':__file__,'__name__':'__main__'})
