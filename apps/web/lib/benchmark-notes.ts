/**
 * Workloads the checked-in results still list as unsupported, whose capability has since reached the
 * standard library. The results file is the harness's record and is not edited here; this says what
 * the page should tell a reader. An entry belongs here only when the capability is documented and tested
 * in the compiler repository, and it leaves when the workload is written in all three languages and
 * appears in the results as implemented.
 */
export const POSSIBLE_NOW: Record<string, string> = {
    json_parse:
        '`std.json` (new in 0.2) reads a document strictly per RFC 8259. The workload is not yet written in Prismio, C++ and Rust.',
    json_serialize:
        '`std.json` (new in 0.2) has a `JsonWriter` and `jsonQuote` for the commas and escapes. The workload is not yet written in all three languages.',
    lock_free_queue:
        '`std.raw` has pointer atomics with an explicit memory ordering and compare-exchange. There is still no safe atomic type, so the workload would sit on raw pointers, and it is not yet written.',
};

export const isPossibleNow = (name: string) => Object.prototype.hasOwnProperty.call(POSSIBLE_NOW, name);

/**
 * Unsupported workloads where part of what they need exists. The workload stays unsupported, and the
 * note says what is already there so the missing piece is clear.
 */
export const PARTLY_THERE: Record<string, string> = {
    custom_allocator_churn:
        '`std.mem.Arena` is a bump allocator and already ships; the `arena_bump` workload measures it. What is missing is passing an allocator into `Vec` or `HashMap`, as C++ `pmr` and Rust `allocator_api` do.',
    async_event_loop:
        '`async fn`, `await` and `scope { }` exist. What is missing is a non-blocking reactor and a scheduler: an `await` still blocks its thread.',
    mmap_file_io:
        '`std.syscall` can call `mmap` on Linux and macOS. `std.fs` has no mapping API, so the workload would be a raw system-call shim.',
};
