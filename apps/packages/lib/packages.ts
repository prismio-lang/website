export interface PackageMeta {
    name: string;
    version: string;
    description: string;
    category: 'stdlib' | 'ffi' | 'compiler' | 'systems' | 'data';
    abi: 'c-direct' | 'llvm-ir' | 'native-dual';
    aifMemory: 'zero-alloc' | 'stack-dominant' | 'arena-scoped';
    downloads: string;
    stars: string;
    updatedAt: string;
    author: string;
    verified: boolean;
}

export const REGISTRY_PACKAGES: PackageMeta[] = [
    {
        name: "@prismio/net-http",
        version: "1.4.0",
        description: "Zero-allocation asynchronous HTTP/1.1 & HTTP/2 server utilizing kernel epoll/kqueue with AIF stack-buffered frames.",
        category: "stdlib",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "128.4k",
        stars: "1,420",
        updatedAt: "2 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prismio/llvm-opt",
        version: "0.9.2",
        description: "Custom LLVM pass pipelines, vectorization heuristics, and link-time optimization (LTO) profiles for Prismio binaries.",
        category: "compiler",
        abi: "llvm-ir",
        aifMemory: "stack-dominant",
        downloads: "84.2k",
        stars: "912",
        updatedAt: "5 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "zstd-native",
        version: "1.5.6",
        description: "Direct C ABI bindings to Facebook Zstandard compression with streaming SIMD dictionary acceleration and zero marshaling overhead.",
        category: "ffi",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "92.6k",
        stars: "740",
        updatedAt: "1 week ago",
        author: "systems-collective",
        verified: true,
    },
    {
        name: "@prismio/simd-tensor",
        version: "0.8.0",
        description: "Hardware-accelerated multi-dimensional array tensors with AVX-512 and ARM NEON vectorized matrix kernels.",
        category: "systems",
        abi: "llvm-ir",
        aifMemory: "arena-scoped",
        downloads: "46.1k",
        stars: "610",
        updatedAt: "3 days ago",
        author: "hpc-lab",
        verified: true,
    },
    {
        name: "@prismio/sqlite-raw",
        version: "3.45.1",
        description: "Type-safe compile-time SQL statement verification and direct embedded SQLite3 engine integration with zero heap copying.",
        category: "data",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "78.9k",
        stars: "830",
        updatedAt: "4 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prismio/crypto-ring",
        version: "0.5.1",
        description: "Constant-time cryptographic implementations (Ed25519, ChaCha20-Poly1305, SHA3) verified against timing side-channel attacks.",
        category: "systems",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "54.8k",
        stars: "594",
        updatedAt: "1 week ago",
        author: "sec-wg",
        verified: true,
    },
    {
        name: "@prismio/async-io",
        version: "1.2.0",
        description: "High-throughput asynchronous task scheduler featuring work-stealing thread pools and timer wheel primitives.",
        category: "stdlib",
        abi: "llvm-ir",
        aifMemory: "stack-dominant",
        downloads: "112.0k",
        stars: "1,180",
        updatedAt: "1 day ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prismio/codec-json",
        version: "2.1.0",
        description: "Zero-copy SIMD-accelerated JSON parser with compile-time schema introspection and zero intermediate allocations.",
        category: "data",
        abi: "c-direct",
        aifMemory: "zero-alloc",
        downloads: "98.3k",
        stars: "765",
        updatedAt: "6 days ago",
        author: "prismio-core",
        verified: true,
    },
    {
        name: "@prismio/tracing",
        version: "0.4.3",
        description: "Zero-cost structured span logging and OpenTelemetry-compatible tracing infrastructure designed for embedded and cloud runtimes.",
        category: "systems",
        abi: "native-dual",
        aifMemory: "stack-dominant",
        downloads: "38.5k",
        stars: "420",
        updatedAt: "2 weeks ago",
        author: "observability-team",
        verified: true,
    },
];

export const CATEGORIES = [
    {id: "all", label: "All"},
    {id: "stdlib", label: "Standard"},
    {id: "ffi", label: "C FFI"},
    {id: "compiler", label: "Compiler"},
    {id: "systems", label: "Systems"},
    {id: "data", label: "Data"},
] as const;

export const ABI_LABEL: Record<PackageMeta["abi"], string> = {
    "c-direct": "C ABI",
    "llvm-ir": "LLVM IR",
    "native-dual": "C ABI + IR",
};

export const MEMORY_LABEL: Record<PackageMeta["aifMemory"], string> = {
    "zero-alloc": "Zero heap",
    "stack-dominant": "Stack-first",
    "arena-scoped": "Arena-scoped",
};

export function findPackage(name: string) {
    return REGISTRY_PACKAGES.find((p) => p.name === name);
}
