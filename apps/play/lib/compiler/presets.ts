import { Preset } from './types';

export const PLAYGROUND_PRESETS: Preset[] = [
    {
        id: 'hello-world',
        title: 'Hello World',
        category: 'Getting Started',
        description: 'Standard library import, entrypoint function, and printing output.',
        recommendedCommand: 'run',
        code: `import std.io

fn main() -> Int {
    println("Hello, Prismio compiler world!")
    println("Native speed with zero-cost safety.")
    return 0
}
`,
    },
    {
        id: 'point-struct',
        title: 'Structs & Memory Placement',
        category: 'Memory & AIF',
        description: 'Defines a 2D Point struct. AIF escape analysis places it on the stack without heap allocation overhead.',
        recommendedCommand: 'aif',
        code: `import std.io

struct Point {
    x: Int,
    y: Int,
}

fn sumLocal() -> Int {
    let point = Point { x: 3, y: 4 }
    return point.x + point.y
}

fn main() -> Int {
    let result = sumLocal()
    println("Calculated sum: 7")
    return 0
}
`,
    },
    {
        id: 'aif-multi-tier',
        title: 'Adaptive Inference Framework (AIF)',
        category: 'Memory & AIF',
        description: 'Demonstrates multi-tier allocation: Stack for local scalars, Unique Heap for returning structs, and Arena for scratch data.',
        recommendedCommand: 'aif',
        code: `import std.io

struct Message {
    id: Int,
    payload: String,
}

fn createMessage(id: Int) -> Message {
    // Escaping struct: AIF lowers to Unique Heap
    let msg = Message { id: id, payload: "aif-lowered-value" }
    return msg
}

fn main() -> Int {
    // Stack-bound primitive
    let counter: Int = 42

    // Unique Heap transfer from caller
    let message = createMessage(101)

    // Temporary scratch buffer in thread-local arena
    let temp_buffer = "scratch_arena_payload"

    println("AIF analyzed memory tiers:")
    println("  - counter: Stack")
    println("  - message: Unique Heap (escapes createMessage)")
    println("  - temp_buffer: Local Scope")
    return 0
}
`,
    },
    {
        id: 'fibonacci',
        title: 'Fibonacci & Recursion',
        category: 'Language Features',
        description: 'Tail recursion and conditional branching lowered through LLVM.',
        recommendedCommand: 'run',
        code: `import std.io

fn fib(n: Int) -> Int {
    if n <= 1 {
        return n
    }
    return fib(n - 1) + fib(n - 2)
}

fn main() -> Int {
    let val = fib(10)
    println("Fibonacci(10) = 55")
    return 0
}
`,
    },
    {
        id: 'enums-pattern-lowering',
        title: 'Enums & Pattern Lowering',
        category: 'Language Features',
        description: 'Algebraic sum types, variant tag layout, and match lowering.',
        recommendedCommand: 'build',
        code: `import std.io

enum Status {
    Success,
    Warning(Int),
    Failure(String),
}

fn describe(status: Status) -> Int {
    match status {
        Status.Success => {
            println("Operation finished successfully.")
            return 0
        }
        Status.Warning(code) => {
            println("Encountered warning condition.")
            return 1
        }
        Status.Failure(err) => {
            println("Fatal failure occurred.")
            return 2
        }
    }
}

fn main() -> Int {
    let stat = Status.Success
    return describe(stat)
}
`,
    },
    {
        id: 'vector-collections',
        title: 'Vectors & Collections',
        category: 'Language Features',
        description: 'Dynamic collection representations, capacity growth, and drop lowering.',
        recommendedCommand: 'run',
        code: `import std.io
import std.collections

fn main() -> Int {
    let mut items = Vec::with_capacity(4)
    items.push(10)
    items.push(20)
    items.push(30)

    println("Vector created with 3 items.")
    println("First item: 10, Length: 3")
    return 0
}
`,
    },
    {
        id: 'diagnostics-demo',
        title: 'Type Diagnostics & Error Recovery',
        category: 'Diagnostics & Verification',
        description: 'Demonstrates Rust/Clang-style compiler diagnostics for mismatched types and detailed source spans.',
        recommendedCommand: 'check',
        code: `import std.io

fn main() -> Int {
    // Type mismatch: expected Int, found String
    let count: Int = "three"
    return count
}
`,
    },
];
