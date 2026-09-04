# FS & Paths

> 🚧 **Coming Soon** – The filesystem module is planned for a future release. This page describes the intended API.

## Overview

The `std.fs` module provides cross-platform filesystem operations. Prismio abstracts over the differences between Linux, macOS, and Windows filesystems through a unified API.

```prismio
// Planned import
import std.fs
import std.fs.Path
```

---

## The `Path` Type

`Path` is an immutable, OS-agnostic representation of a filesystem path.

```prismio
// Planned syntax
let home = Path.new("/home/user")
let config = home.join(".config").join("prismio")

println(config.toString())
// Linux/macOS: /home/user/.config/prismio
// Windows: C:\Users\user\.config\prismio
```

### Path Operations

```prismio
let path = Path.new("/home/user/docs/notes.txt")

path.parent()       // Path: /home/user/docs
path.fileName()     // String: "notes.txt"
path.stem()         // String: "notes"
path.extension()    // String: "txt"
path.isAbsolute()   // Bool: true
path.isRelative()   // Bool: false
path.exists()       // Bool: (checks filesystem)
path.isFile()       // Bool
path.isDir()        // Bool
```

### Building Paths

```prismio
// Join paths safely (no string concatenation)
let base = Path.new("/usr/local")
let bin  = base.join("bin").join("prismio")
// Result: /usr/local/bin/prismio

// Path from components
let path = Path.from(["home", "user", "projects"])
```

---

## Reading Files

```prismio
// Planned syntax
import std.fs

// Read entire file as String
let content = fs.readToString("config.toml")   // Result<String, FsError>

match content {
    Ok(text) -> println(text),
    Err(e)   -> println("Failed to read: ${e}"),
}

// Read as bytes
let bytes = fs.readBytes("image.png")   // Result<[Byte], FsError>

// Read lines
let lines = fs.readLines("data.csv")   // Result<[String], FsError>
for line in lines! {
    processLine(line)
}
```

---

## Writing Files

```prismio
// Planned syntax

// Write string to file (overwrites)
fs.writeString("output.txt", "Hello, World!")   // Result<Unit, FsError>

// Append to file
fs.appendString("log.txt", "New entry\n")

// Write bytes
fs.writeBytes("data.bin", [0xFF, 0x00, 0xAB])
```

---

## Buffered I/O

For large files, use buffered readers/writers:

```prismio
// Planned syntax
import std.fs.BufReader
import std.fs.BufWriter

// Buffered reading
let reader = BufReader.open("large_file.txt")
for line in reader.lines() {
    processLine(line)
}
reader.close()

// Buffered writing
let writer = BufWriter.create("output.txt")
writer.writeLine("Line 1")
writer.writeLine("Line 2")
writer.flush()
writer.close()
```

---

## Directory Operations

```prismio
// Planned syntax

// Create directory
fs.createDir("my_dir")                  // Result<Unit, FsError>
fs.createDirAll("path/to/nested/dir")   // Create all intermediate dirs

// Remove
fs.removeFile("old.txt")                // Result<Unit, FsError>
fs.removeDir("empty_dir")              // Only works if empty
fs.removeDirAll("dir_with_contents")   // Recursive delete

// List directory contents
let entries = fs.readDir(".")           // Result<[DirEntry], FsError>
for entry in entries! {
    println("${entry.name()} - ${entry.fileType()}")
}
```

---

## File Metadata

```prismio
// Planned syntax
let meta = fs.metadata("report.pdf")    // Result<Metadata, FsError>
let m = meta!

println(m.size())              // File size in bytes
println(m.isFile())            // true
println(m.isDir())             // false
println(m.created())           // Optional<DateTime>
println(m.modified())          // Optional<DateTime>
println(m.permissions())       // Permissions object
```

---

## Walking a Directory Tree

```prismio
// Planned syntax
import std.fs.WalkDir

for entry in WalkDir.new(".") {
    let path = entry.path()
    if path.extension() == "pr" {
        println("Found Prismio file: ${path}")
    }
}

// With depth limit
for entry in WalkDir.new(".").maxDepth(3) {
    println(entry.path())
}
```

---

## Temporary Files and Directories

```prismio
// Planned syntax
import std.fs.TempDir

let tmp = TempDir.new()            // auto-deleted when dropped
let tmpFile = tmp.path().join("scratch.txt")
fs.writeString(tmpFile, "temporary data")

// Use the temp file...
// It's automatically deleted when `tmp` goes out of scope
```

---

## Error Handling

All filesystem operations return `Result<T, FsError>`. Common error variants:

| Error | Description |
|-------|-------------|
| `FsError.NotFound` | File or directory doesn't exist |
| `FsError.PermissionDenied` | Insufficient permissions |
| `FsError.AlreadyExists` | File already exists (for create operations) |
| `FsError.IsDirectory` | Expected a file but found a directory |
| `FsError.NotDirectory` | Expected a directory but found a file |
| `FsError.Io(msg)` | Other I/O error |

```prismio
match fs.readToString("data.txt") {
    Ok(content) -> process(content),
    Err(FsError.NotFound) -> println("File not found"),
    Err(FsError.PermissionDenied) -> println("Access denied"),
    Err(e) -> println("Unexpected error: ${e}"),
}
```

---

## Platform Notes

| Feature | Linux | macOS | Windows |
|---------|-------|-------|---------|
| Case-sensitive paths | ✅ | ❌ (default) | ❌ |
| Symlinks | ✅ | ✅ | ✅ (limited) |
| File locking | Advisory | Advisory | Mandatory |
| Max path length | 4096 | 1024 | 260 (legacy) / 32767 |

> **Windows long paths:** On Windows, enable long path support in Group Policy or the registry to exceed the 260-character limit.

See also: [I/O](./io.md), [Platform Targets](../platform/windows.md)
