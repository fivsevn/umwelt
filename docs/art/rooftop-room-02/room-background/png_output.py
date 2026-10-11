"""Remove provenance metadata from native-render PNGs without changing pixels."""
import hashlib
import struct
from pathlib import Path

PNG_SIGNATURE = b'\x89PNG\r\n\x1a\n'
PRIVATE_CHUNKS = {b'tEXt', b'zTXt', b'iTXt', b'eXIf'}


def chunks(data):
    if data[:8] != PNG_SIGNATURE:
        raise ValueError('Expected a PNG file')
    offset = 8
    while offset < len(data):
        length = struct.unpack('>I', data[offset:offset + 4])[0]
        end = offset + 12 + length
        if end > len(data):
            raise ValueError('Truncated PNG chunk')
        yield data[offset + 4:offset + 8], data[offset:end]
        offset = end
    if offset != len(data):
        raise ValueError('Invalid PNG chunk boundary')


def sanitize_png(path):
    path = Path(path)
    original = path.read_bytes()
    before = list(chunks(original))
    removed = [kind.decode('ascii') for kind, _ in before if kind in PRIVATE_CHUNKS]
    output = PNG_SIGNATURE + b''.join(chunk for kind, chunk in before if kind not in PRIVATE_CHUNKS)
    after = list(chunks(output))
    original_idat = b''.join(chunk for kind, chunk in before if kind == b'IDAT')
    final_idat = b''.join(chunk for kind, chunk in after if kind == b'IDAT')
    assert original_idat == final_idat
    assert not any(kind in PRIVATE_CHUNKS for kind, _ in after)
    path.write_bytes(output)
    return dict(pngSha256=hashlib.sha256(output).hexdigest(),
                metadataChunksRemoved=removed, metadataChunksRemaining=[],
                compressedPixelChunksUnchanged=True,
                idatSha256=hashlib.sha256(final_idat).hexdigest())
