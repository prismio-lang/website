# Windows Target

Prismio supports Windows 10 and Windows 11 on x86_64 architecture.

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| Windows version | Windows 10 (1903+) |
| Architecture | x86_64 |
| Toolchain | MSVC (recommended) or MinGW-w64 |

---

## Installation

### Installer

> 🚧 **Coming Soon** – A Windows installer (.msi) is planned.

### Manual Installation

1. Download the latest Windows release:
   ```
   https://github.com/prismio-lang/prismio/releases/latest/download/prismio-windows-x86_64.zip
   ```

2. Extract the zip file

3. Add the extracted directory to your `PATH`:
   - Open **Start** → search "Environment Variables"
   - Edit **System variables** → `Path`
   - Add the directory containing `prismio.exe`

4. Verify in a new terminal:
   ```powershell
   prismio --version
   ```

### Windows Package Manager (winget)

> 🚧 **Coming Soon**

```powershell
# Planned
winget install prismio-lang.prismio
```

### Scoop

> 🚧 **Coming Soon**

```powershell
# Planned
scoop bucket add prismio https://github.com/prismio-lang/scoop-bucket
scoop install prismio
```

---

## Toolchain Options

### MSVC (Recommended)

The Microsoft Visual C++ toolchain is recommended for best compatibility with Windows APIs and libraries.

**Prerequisites:**
- [Visual Studio 2022](https://visualstudio.microsoft.com/) (Community edition is free)
- Install the "Desktop development with C++" workload

Or just the Build Tools (no IDE):
```powershell
# Install Visual Studio Build Tools
winget install Microsoft.VisualStudio.2022.BuildTools
```

### MinGW-w64

An alternative using GCC/Clang on Windows:

```powershell
# Install via MSYS2
winget install MSYS2.MSYS2

# In MSYS2 terminal:
pacman -S mingw-w64-x86_64-toolchain mingw-w64-x86_64-llvm
```

---

## Building on Windows

```powershell
# Basic build
prismio build

# Release build
prismio build --release

# Run
prismio run

# The output binary will be myproject.exe
```

---

## PATH Setup

Proper PATH configuration is important on Windows. The Prismio installer will handle this automatically when available.

For manual setup via PowerShell:

```powershell
# Add to current user PATH permanently
$env:PATH += ";C:\path\to\prismio"
[Environment]::SetEnvironmentVariable(
    "PATH",
    $env:PATH + ";C:\path\to\prismio",
    "User"
)
```

---

## Visual Studio Integration

> 🚧 **Coming Soon** – A Visual Studio extension is planned.

Features planned:
- Syntax highlighting
- Build integration
- Debugger support
- Project templates

---

## WSL2 as an Alternative

Windows Subsystem for Linux 2 (WSL2) provides an excellent Linux environment on Windows and is often the easiest way to use Prismio on Windows during the early development phase:

```powershell
# Enable WSL2
wsl --install

# After restart, install Ubuntu
wsl --install -d Ubuntu

# Inside WSL2, follow Linux installation instructions
```

Benefits of WSL2:
- Full Linux ABI compatibility
- Better filesystem performance (native ext4)
- Access to Linux-only tooling
- Compile Linux binaries directly

WSL2 can still access Windows files via `/mnt/c/...`.

---

## Windows API Bindings

> 🚧 **Coming Soon** – Windows API bindings are planned.

```prismio
// Planned: Windows API access via FFI
import windows.win32.system.Console

fn main() {
    let handle = Console.getStdHandle(.StdOutputHandle)
    // ...
}
```

Planned Windows-specific features:
- Win32 API bindings
- COM/WinRT interop
- Windows Registry access
- Windows Services
- Event Tracing for Windows (ETW)

---

## CI/CD on Windows

### GitHub Actions

```yaml
build-windows:
  runs-on: windows-2022
  steps:
    - uses: actions/checkout@v3
    
    - name: Install Prismio
      run: |
        Invoke-WebRequest -Uri "https://github.com/prismio-lang/prismio/releases/latest/download/prismio-windows-x86_64.zip" -OutFile prismio.zip
        Expand-Archive prismio.zip -DestinationPath prismio
        echo "$PWD\prismio" | Out-File -FilePath $env:GITHUB_PATH -Append
    
    - name: Build
      run: prismio build --release
    
    - name: Test
      run: prismio test
```

---

## Windows-Specific Notes

### Line Endings

Prismio source files use LF line endings. Configure Git to not convert:

```bash
git config --global core.autocrlf input
```

### Long Path Support

Enable long path support for paths > 260 characters:

```powershell
# As Administrator
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
    -Name "LongPathsEnabled" -Value 1
```

### Antivirus Considerations

Some antivirus software may flag newly compiled binaries. Add your build output directory to the antivirus exclusion list for better build performance.

See also: [Installation](../getting_started/install.md), [Linux Target](./linux.md), [macOS Target](./macos.md)
