# Time & Dates

> 🚧 **Coming Soon** – The `std.time` module is planned and actively being designed. The API shown on this page reflects the intended design and is subject to change before release.

The `std.time` module will provide first-class support for measuring time, representing durations, formatting dates, handling timezones, and pausing execution. The API is inspired by Rust's `std::time` and Kotlin's `kotlinx.datetime`, with an emphasis on correctness and clarity.

---

## Module Import (Planned)

```prismio
import std.time.{ Instant, Duration, DateTime, TimeZone, sleep }
```

---

## `Instant` — A Point in Time

`Instant` represents a single moment in time with nanosecond precision. It is monotonically increasing (for measuring elapsed time) and does not carry timezone information.

```prismio
import std.time.{ Instant, Duration }

fn main() {
    let start = Instant.now()

    // ... do some work ...
    let mut sum = 0
    let mut i = 0
    while i < 1_000_000 {
        sum = sum + i
        i = i + 1
    }

    let end = Instant.now()
    let elapsed = end.durationSince(start)

    println("Elapsed: ${elapsed.toMillis()} ms")
    println("Sum: ${sum}")
}
```

### Planned `Instant` API

```prismio
Instant.now()                    // current monotonic instant
Instant.fromEpochMillis(ms)      // create from Unix milliseconds

instant.durationSince(other)     // Duration between two instants
instant.plus(duration)           // Instant + Duration
instant.minus(duration)          // Instant - Duration
instant.isBefore(other)          // Bool
instant.isAfter(other)           // Bool
instant.toEpochMillis()          // Int64 — milliseconds since Unix epoch
instant.toEpochSeconds()         // Int64 — seconds since Unix epoch
```

---

## `Duration` — A Span of Time

`Duration` represents a length of time. It is always non-negative.

```prismio
import std.time.{ Duration }

fn main() {
    let oneSecond = Duration.fromSeconds(1)
    let fiveMinutes = Duration.fromMinutes(5)
    let twoHours = Duration.fromHours(2)
    let threeDays = Duration.fromDays(3)
    let precise = Duration.fromMillis(1500)   // 1.5 seconds
    let nano = Duration.fromNanos(500_000_000) // 0.5 seconds

    println(oneSecond.toMillis())     // 1000
    println(fiveMinutes.toSeconds())  // 300
    println(twoHours.toMinutes())     // 120

    // Arithmetic
    let total = fiveMinutes.plus(oneSecond)   // 5 minutes 1 second
    let diff = fiveMinutes.minus(oneSecond)   // 4 minutes 59 seconds

    // Comparison
    println(oneSecond < fiveMinutes)   // true
    println(twoHours > threeDays)      // false

    // Check if zero
    println(Duration.zero().isZero())  // true
}
```

### Planned `Duration` API

```prismio
Duration.fromNanos(n)       // from nanoseconds
Duration.fromMillis(n)      // from milliseconds
Duration.fromSeconds(n)     // from seconds
Duration.fromMinutes(n)     // from minutes
Duration.fromHours(n)       // from hours
Duration.fromDays(n)        // from days
Duration.zero()             // zero duration

duration.toNanos()          // Int64
duration.toMillis()         // Int64
duration.toSeconds()        // Float (fractional seconds)
duration.toMinutes()        // Float
duration.toHours()          // Float
duration.toDays()           // Float

duration.plus(other)        // Duration + Duration
duration.minus(other)       // Duration - Duration (clamps to zero)
duration.times(factor)      // Duration * Int
duration.dividedBy(n)       // Duration / Int

duration.isZero()           // Bool
duration.toString()         // e.g. "5m 30s" or "00:05:30"
```

---

## `DateTime` — Wall-Clock Date and Time

`DateTime` represents a human-readable calendar date and time, optionally associated with a timezone.

```prismio
import std.time.{ DateTime, TimeZone }

fn main() {
    // Current date/time in the system local timezone
    let now = DateTime.now()
    println(now.year())    // e.g. 2026
    println(now.month())   // 1–12
    println(now.day())     // 1–31
    println(now.hour())    // 0–23
    println(now.minute())  // 0–59
    println(now.second())  // 0–59

    // Construct a specific datetime
    let release = DateTime.of(2026, 1, 15, 9, 0, 0, TimeZone.utc())
    println(release.format("yyyy-MM-dd HH:mm:ss"))  // 2026-01-15 09:00:00

    // In a specific timezone
    let tz = TimeZone.of("America/New_York")
    let local = now.inTimeZone(tz)
    println(local.format("yyyy-MM-dd HH:mm:ss z"))
}
```

### Planned `DateTime` API

```prismio
DateTime.now()                          // current date/time (local timezone)
DateTime.nowUtc()                       // current date/time in UTC
DateTime.of(year, month, day, h, m, s, tz)  // construct specific datetime
DateTime.fromEpochMillis(ms, tz)        // from Unix timestamp

datetime.year()          // Int
datetime.month()         // Int (1-12)
datetime.day()           // Int (1-31)
datetime.hour()          // Int (0-23)
datetime.minute()        // Int (0-59)
datetime.second()        // Int (0-59)
datetime.nanosecond()    // Int
datetime.dayOfWeek()     // Weekday enum (Monday..Sunday)
datetime.dayOfYear()     // Int (1-366)

datetime.format(pattern) // String — format using pattern
datetime.toInstant()     // Instant
datetime.inTimeZone(tz)  // DateTime in different timezone
datetime.toUtc()         // DateTime in UTC

datetime.plusDays(n)     // DateTime + n days
datetime.plusHours(n)    // DateTime + n hours
datetime.plusMinutes(n)
datetime.plusSeconds(n)
datetime.plusMonths(n)
datetime.plusYears(n)

datetime.isBefore(other) // Bool
datetime.isAfter(other)  // Bool
datetime.isEqual(other)  // Bool
```

---

## Date Formatting

`DateTime.format()` will use a pattern language similar to ISO 8601 and familiar from other languages:

| Pattern | Description | Example |
|---|---|---|
| `yyyy` | 4-digit year | `2026` |
| `yy` | 2-digit year | `26` |
| `MM` | Month (zero-padded) | `01`–`12` |
| `MMM` | Month abbreviation | `Jan`, `Feb` |
| `MMMM` | Full month name | `January` |
| `dd` | Day of month (zero-padded) | `01`–`31` |
| `HH` | Hour 24h (zero-padded) | `00`–`23` |
| `hh` | Hour 12h (zero-padded) | `01`–`12` |
| `mm` | Minutes | `00`–`59` |
| `ss` | Seconds | `00`–`59` |
| `SSS` | Milliseconds | `000`–`999` |
| `a` | AM/PM | `AM`, `PM` |
| `z` | Timezone abbreviation | `UTC`, `EST` |
| `Z` | Timezone offset | `+05:30` |

```prismio
import std.time.{ DateTime }

fn main() {
    let now = DateTime.nowUtc()
    println(now.format("yyyy-MM-dd"))             // 2026-06-04
    println(now.format("dd MMMM yyyy"))           // 04 June 2026
    println(now.format("HH:mm:ss"))               // 14:30:00
    println(now.format("yyyy-MM-dd'T'HH:mm:ssZ")) // 2026-06-04T14:30:00+00:00
}
```

### Parsing Dates from Strings (Planned)

```prismio
import std.time.{ DateTime, TimeZone }

fn main() {
    let parsed = DateTime.parse("2026-06-04", "yyyy-MM-dd", TimeZone.utc())
    match parsed {
        Result.ok(dt)  => println("Year: ${dt.year()}")
        Result.err(e)  => println("Parse error: ${e}")
    }
}
```

---

## `TimeZone`

The `TimeZone` type represents an IANA timezone (e.g., `"America/New_York"`, `"Asia/Kolkata"`, `"Europe/London"`).

```prismio
import std.time.{ TimeZone }

let utc = TimeZone.utc()                    // UTC
let local = TimeZone.local()                // system local timezone
let tz = TimeZone.of("Asia/Kolkata")        // specific timezone

println(tz.offsetAt(Instant.now()))         // Duration representing current UTC offset
println(tz.id())                            // "Asia/Kolkata"
```

---

## Sleeping and Delays

`sleep()` pauses the current thread of execution for the given duration:

```prismio
import std.time.{ sleep, Duration }

fn main() {
    println("Starting...")
    sleep(Duration.fromSeconds(2))   // pause for 2 seconds
    println("2 seconds later!")

    sleep(Duration.fromMillis(500))  // pause for 500ms
    println("Done.")
}
```

> **Note:** `sleep()` blocks the current thread. In async contexts (when `std.async` is available), use `async.sleep()` instead so that other async tasks can run during the delay.

---

## Measuring Elapsed Time

The idiomatic way to time a block of code:

```prismio
import std.time.{ Instant }

fn timed<T>(label: String, work: fn() -> T) -> T {
    let start = Instant.now()
    let result = work()
    let elapsed = Instant.now().durationSince(start)
    println("[${label}] took ${elapsed.toMillis()} ms")
    return result
}

fn main() {
    let result = timed("sort", fn() -> {
        let mut arr = [5, 3, 8, 1, 9, 2, 7, 4, 6]
        arr.sort()
        return arr
    })
    println(result)
}
```

---

## Planned Roadmap

| Feature | Status |
|---|---|
| `Instant` type | 🚧 In Design |
| `Duration` type | 🚧 In Design |
| `sleep()` | 🚧 In Design |
| `DateTime` (naive) | 🚧 Planned |
| Timezone support (IANA) | 🚧 Planned |
| Date formatting | 🚧 Planned |
| Date parsing | 🚧 Planned |
| Leap second handling | 🚧 Under Discussion |

---

## See Also

- [Concurrency](/stdlib/concurrency) — async sleep and parallel execution
- [Standard Library Overview](/stdlib/overview) — all stdlib modules
