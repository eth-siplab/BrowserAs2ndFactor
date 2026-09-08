"""Package only runtime files; stamp generated manifests with the tag version."""

import json
from pathlib import Path
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def package(version, output):
    if not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", version):
        raise ValueError("Expected a numeric version such as 0.3.0")
    if any(int(part) > 65535 for part in version.split('.')) or version == '0.0.0':
        raise ValueError("Version components must be <= 65535 and not all zero")
    output.mkdir(parents=True, exist_ok=True)
    for browser, source in [('chrome', ROOT / 'chrome/dist'), ('firefox', ROOT / 'firefox')]:
        manifest = json.loads((source / 'manifest.json').read_text())
        manifest['version'] = version
        with zipfile.ZipFile(output / f'{browser}-{version}.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
            archive.writestr('manifest.json', json.dumps(manifest, indent=2) + '\n')
            for name in ['background.js', 'content.js', 'popup.js', 'popup.html']:
                archive.write(source / name, name)
            for path in sorted((source / 'images').rglob('*')):
                if path.is_file() and not any(part.startswith('.') for part in path.relative_to(source).parts):
                    archive.write(path, path.relative_to(source))


if __name__ == '__main__':
    package(sys.argv[1], Path(sys.argv[2]))
