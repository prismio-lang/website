---
title: JSON
description: The std.json module — reading a JSON document without building a tree, and writing one with the commas and escapes done for you.
status: stable
version: "0.2.0"
lastUpdated: "2026-10-25"
tags: [standard-library, json, parsing, serialization]
related: [stdlib/strings, stdlib/option, stdlib/input]
---

`import std.json`. `parseJson` reads a document; `JsonWriter` writes one. The parser follows RFC 8259 strictly — no comments, no trailing commas, no raw control characters in a string, no leading zeros — and says where the first mistake is.

<!-- prismio-check: pass -->
```prismio
import std.io
import std.json
import std.option
import std.string

fn main() -> Int {
    let doc = parseJson("{\"method\": \"initialize\", \"params\": {\"processId\": 4242}}")
    if (doc.ok == false) {
        println(doc.error)
        return 1
    }
    println(doc.text(doc.path(doc.root, "method").unwrapOr(0 - 1)))
    println(doc.int(doc.path(doc.root, "params.processId").unwrapOr(0 - 1)))

    let out = JsonWriter()
    out.beginObject()
    out.key("jsonrpc")
    out.string("2.0")
    out.key("id")
    out.int(7)
    out.endObject()
    println(out.finish())
    return 0
}
```

```text
initialize
4242
{"jsonrpc":"2.0","id":7}
```

## A document is a tape

Parsing records every value once, in order, in parallel columns, and a value is then an `Int`: its place on the tape. Nothing is copied out of the source until you ask for it, so reading three fields of a megabyte message allocates three strings. The cost is that a handle means something only to the document that made it.

A missing member is `none`, not a null value. JSON's `null` is a value (`isNull`); an absent key is not.

## Reference

**Reading.** `parseJson(text)` returns a `JsonDocument` with `ok`, `error`, `errorAt` (a byte offset) and `root`; a document that did not parse has `root == -1`.

| Method | Returns |
|---|---|
| `kind(node)` | `JsonKind`: `Null`, `Bool`, `Number`, `String`, `Array`, `Object` |
| `member(node, name)` | `Int?`: the member's value (the last one, for a repeated name) |
| `element(node, index)` | `Int?` |
| `path(node, "a.b.c")` | `Int?`: through nested objects; use `member` for a name containing a dot |
| `length(node)` | elements of an array, members of an object; `0` otherwise |
| `children(node)`, `keys(node)` | `Vec<Int>` of elements or member values; `Vec<String>` of member names |
| `text(node)` | the string with its escapes decoded, `""` for any other kind |
| `int(node)`, `float(node)`, `bool(node)` | the value, `0`, `0.0` or `false` for the wrong kind |
| `raw(node)` | the value exactly as written, to put back unchanged (a JSON-RPC `id` is a number or a string and must come back as the same one) |
| `isNull`, `isObject`, `isArray` | `Bool` |

**Writing.** `JsonWriter()` and, in order: `beginObject` / `endObject`, `beginArray` / `endArray`, `key(name)` before each value inside an object, then `string`, `int`, `float`, `bool`, `null` or `raw` (JSON already written). `finish()` returns the document. `jsonQuote(text)` is one string as a JSON literal.

## Things that bite

**Nesting deeper than 256 is refused**, with an error and not a crash. **`\u` escapes decode to UTF-8**, a surrogate pair to one four-byte character, and a lone surrogate to U+FFFD. Decoding and quoting are linear in the text.

**A handle from one document means nothing to another.** Keep the document alive while you use its handles.
