---
title: Types and ABI
description: Prismio-to-LLVM type keys, storage forms, field layout, target widths, optional encoding, string ABI, and foreign-call coercion.
status: implemented
version: "0.1.0"
lastUpdated: "2026-09-08"
tags: [llvm, types, abi]
related: [llvm/overview, runtime/collection-representations, compiler/string-representation]
---

The backend never maps a type from spelling alone when semantic information exists. Semantic
analysis stores a resolved type on each annotation and expression; `mapTypeNode` and
`getExprType` read that result and turn it into a compact bridge key. The C backend's
`type_from_key` converts the key into an `LLVMTypeRef`.

## Primitive and built-in mappings

| Prismio type | IR key | LLVM type | Important rule |
| --- | --- | --- | --- |
| `Bool` | `i1` | `LLVMInt1TypeInContext` | Boolean in SSA; inline container storage rounds to one byte |
| `Char`, `I8`, `U8` | `i8` | `LLVMInt8TypeInContext` | Signedness belongs to operations, not LLVM integer types |
| `I16`, `U16` | `i16` | `LLVMInt16TypeInContext` | Cast selection determines extension behavior |
| `Int`, `U32` | `i32` | `LLVMInt32TypeInContext` | `Int` is signed 32-bit |
| `I64`, `U64` | `i64` | `LLVMInt64TypeInContext` | Used directly, not widened through `Int` |
| `Isize`, `Usize` | selected pointer integer | `i32` or `i64` | `ir_set_pointer_int_type` follows the target data layout |
| `Float` | `double` | `LLVMDoubleTypeInContext` | Prismio's current floating representation is 64-bit |
| `Ptr` | `ptr` | opaque LLVM pointer | Pointee types are not encoded in LLVM's pointer type |
| `String` | `struct:prismio.str` | `{ ptr, usize }` | A value pair internally, a NUL-terminated pointer at C boundaries |
| `Slice<T>` | `struct:prismio.slice` | value aggregate | Carries base, offset/length data required by the runtime contract |
| `DataView<T>` element | `struct:prismio.data_element` | value aggregate | Describes view storage rather than a heap object |
| user `struct S` | `struct:S` | named `%S` body | Locals normally hold a pointer; fields embed non-optional structs |
| `List<T>`, array, `T?` | `ptr` or `ptrptr` | opaque pointer | Representation details are carried by semantic/AIF side tables |

`mapType` handles primitive names. `mapTypeNode` handles resolved annotations, list/array
markers, optionals, and nominal types. `getExprType` reads the semantic type first and has
fallbacks for literals, identifiers, calls, indexing, member access, and aggregate construction.
If a new type is added to only one of these functions, declarations and call sites can disagree;
`LLVMVerifyModule` then reports the mismatch late in emission.

## Three storage questions

The same semantic type may need three different answers:

- `storageType` returns the representation used by locals and parameters. User structs collapse
  to `ptr`; built-in value structs such as the fat string remain aggregates.
- `fieldStorageType` returns what is embedded inside a containing struct. A non-optional user
  struct remains `struct:S`, giving contiguous by-value containment.
- `ffiType` returns what a C declaration sees. It matches ordinary storage except that
  `String` becomes `ptr`, because the runtime buffer is NUL-terminated and the carried length is
  a Prismio calling-convention detail.

These functions must not be merged. If `storageType` were used for fields, a value-shaped field
would become an extra pointer and allocation. If `fieldStorageType` were used for parameters,
the calling convention would silently change. If the fat string crossed FFI unchanged, a C
function expecting `char *` would receive a two-word aggregate.

## Named structs and layout

`ir_struct_type_begin`, `ir_struct_type_field`, and `ir_struct_type_end` build named LLVM
struct bodies. The backend first creates an opaque named type through `LLVMStructCreateNamed`;
after every field key has been converted by `type_from_key`, `LLVMStructSetBody` completes it.
Opaque-first construction permits recursive pointer edges while semantic analysis rejects
impossible direct containment cycles.

When AIF selects hot/cold splitting, `ir_struct_type_split(hotCount)` tells the backend to keep
the first fields in the hot body and place the remaining fields in a cold body reached through one
link word. `ir_struct_field_ptr` is the single access choke point: it uses
`LLVMBuildStructGEP2` directly for hot fields and follows the cold link before addressing cold
fields. Callers continue to use the logical field index.

`ir_struct_size`, `ir_struct_field_offset`, and `ir_struct_field_size` query the selected
`LLVMTargetDataRef` with `LLVMABISizeOfType` and `LLVMABIAlignmentOfType`. AIF uses these
target-aware results; it must not copy host `sizeof` assumptions into a cross build.

## Scalars in pointer-sized slots

Generic list machinery sometimes stores a scalar in a pointer-sized runtime slot without
allocating a box. `scalarBitsOf` identifies the exact bit width. `scalarToSlot` extends integer
bits or bitcasts a `double` before converting them to the slot width. `slotToScalar` reverses
the operation. `scalarInlineBytes` instead returns the byte stride for inline list storage;
`Bool` consumes one byte because indexed addressing cannot name a single packed bit.

Signedness determines the chosen instruction:

- `ir_sext` versus `ir_zext` for widening;
- `ir_sdiv`/`ir_srem` versus `ir_udiv`/`ir_urem`;
- signed versus unsigned `ir_icmp_*`; and
- `ir_sitofp`/`ir_fptosi` versus their unsigned forms.

LLVM integer types themselves are signless, so using the correct builder is the only place this
meaning survives.

## Optional and enum encoding

Reference-shaped optionals use a null pointer. Payload enums use a generated aggregate containing
a tag and payload storage. When an enum can reserve one pointer pattern, `ir_enum_reserve_null`,
`ir_enum_set_null_tag`, and `ir_enum_tag` support null-pointer optimization. The backend uses
`LLVMBuildICmp` against `LLVMConstNull` to recover the logical tag.

Changing an ABI-visible type requires synchronized updates to semantic keys, `types.psm`,
`type_from_key`, struct registration, field access, call coercion, debug metadata, runtime
headers, AIF size queries, serialization of build artifacts, and fixed-point tests. A module that
verifies can still have the wrong ABI, so native C-boundary tests are mandatory.
