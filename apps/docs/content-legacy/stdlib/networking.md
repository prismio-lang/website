# Networking

> 🚧 **Coming Soon** – The networking module is planned for a future release. This page describes the intended API design.

## Overview

The `std.net` module provides cross-platform networking primitives. Prismio aims to make network programming safe, ergonomic, and performant.

```prismio
// Planned imports
import std.net
import std.net.TcpListener
import std.net.TcpStream
import std.net.UdpSocket
```

---

## TCP Sockets

### TCP Server

```prismio
// Planned syntax
import std.net.TcpListener

fn main() {
    let listener = TcpListener.bind("127.0.0.1:8080")!
    println("Listening on port 8080...")

    for connection in listener.incoming() {
        let stream = connection!
        handleClient(stream)
    }
}

fn handleClient(mut stream: TcpStream) {
    let mut buf = [Byte; 1024]
    let n = stream.read(&mut buf)!
    stream.write(&buf[0..n])!   // Echo back
}
```

### TCP Client

```prismio
// Planned syntax
import std.net.TcpStream

fn main() {
    let mut stream = TcpStream.connect("example.com:80")!
    
    let request = "GET / HTTP/1.0\r\nHost: example.com\r\n\r\n"
    stream.writeAll(request.asBytes())!
    
    let mut response = ""
    let mut buf = [Byte; 4096]
    loop {
        let n = stream.read(&mut buf)!
        if n == 0 { break }
        response += String.fromBytes(&buf[0..n])
    }
    
    println(response)
}
```

---

## UDP Sockets

```prismio
// Planned syntax
import std.net.UdpSocket

// UDP Server
fn server() {
    let socket = UdpSocket.bind("0.0.0.0:9000")!
    let mut buf = [Byte; 1024]
    
    loop {
        let (n, addr) = socket.recvFrom(&mut buf)!
        println("Received ${n} bytes from ${addr}")
        socket.sendTo(&buf[0..n], addr)!   // Echo
    }
}

// UDP Client
fn client() {
    let socket = UdpSocket.bind("0.0.0.0:0")!
    socket.sendTo("Hello UDP".asBytes(), "127.0.0.1:9000")!
}
```

---

## HTTP Client

> 🚧 **Coming Soon** – A built-in HTTP client is planned.

```prismio
// Planned syntax
import std.net.http.Client

async fn main() {
    let client = Client.new()
    
    // GET request
    let response = await client.get("https://api.example.com/data")!
    println("Status: ${response.status()}")
    println("Body: ${await response.text()!}")
    
    // POST request with JSON
    let body = json.encode({ "name": "Prismio", "version": "0.1.0" })
    let post = await client.post("https://api.example.com/submit")
        .header("Content-Type", "application/json")
        .body(body)
        .send()!
    
    println(post.status())
}
```

### HTTP Response

```prismio
// Planned
let resp = await client.get(url)!

resp.status()            // Int (e.g., 200)
resp.statusText()        // String (e.g., "OK")
resp.headers()           // Map<String, String>
resp.header("Content-Type")  // Optional<String>
await resp.text()!       // String (response body)
await resp.bytes()!      // [Byte]
await resp.json()!       // Dynamic JSON value
```

---

## DNS Resolution

> 🚧 **Coming Soon**

```prismio
// Planned syntax
import std.net.dns

let addresses = dns.resolve("example.com")!
for addr in addresses {
    println(addr.toString())
    // e.g., 93.184.216.34
}
```

---

## TLS / HTTPS

> 🚧 **Coming Soon**

Prismio will support TLS via a native TLS implementation or system TLS:

```prismio
// Planned syntax
import std.net.tls.TlsConnector

let connector = TlsConnector.new()
let tcpStream = TcpStream.connect("example.com:443")!
let tlsStream = connector.connect("example.com", tcpStream)!

// tlsStream is now encrypted
```

The HTTP client will automatically use TLS for `https://` URLs.

---

## Socket Addresses

```prismio
// Planned syntax
import std.net.SocketAddr
import std.net.IpAddr

// IPv4
let addr4 = SocketAddr.new("192.168.1.1", 8080)
let ip4 = IpAddr.v4(192, 168, 1, 1)

// IPv6
let addr6 = SocketAddr.new("::1", 8080)
let ip6 = IpAddr.v6(0, 0, 0, 0, 0, 0, 0, 1)

// Parsing
let addr = SocketAddr.parse("127.0.0.1:3000")!
println(addr.ip())    // "127.0.0.1"
println(addr.port())  // 3000
```

---

## Error Handling

Network errors use the `NetError` type:

| Error | Description |
|-------|-------------|
| `NetError.ConnectionRefused` | No one listening at that address |
| `NetError.TimedOut` | Connection or operation timed out |
| `NetError.HostUnreachable` | Network is unreachable |
| `NetError.DnsFailure(name)` | DNS resolution failed |
| `NetError.TlsError(msg)` | TLS handshake or certificate error |
| `NetError.Io(msg)` | General I/O error |

```prismio
match TcpStream.connect("localhost:9999") {
    Ok(stream)  -> handleStream(stream),
    Err(NetError.ConnectionRefused) -> println("Nothing listening there"),
    Err(NetError.TimedOut) -> println("Connection timed out"),
    Err(e) -> println("Network error: ${e}"),
}
```

---

## Async Networking

> 🚧 **Coming Soon** – Async networking requires the async runtime.

```prismio
// Planned async TCP server
import std.net.async.TcpListener

async fn main() {
    let listener = await TcpListener.bind("0.0.0.0:8080")!
    
    loop {
        let (stream, addr) = await listener.accept()!
        println("Connection from ${addr}")
        
        // Spawn a task to handle each client concurrently
        task.spawn(handleAsync(stream))
    }
}

async fn handleAsync(mut stream: TcpStream) {
    // async read/write without blocking
}
```

---

## Platform Notes

| Feature | Linux | macOS | Windows |
|---------|-------|-------|---------|
| TCP/UDP | ✅ | ✅ | ✅ |
| Unix sockets | ✅ | ✅ | ✅ (Win10+) |
| IPv6 | ✅ | ✅ | ✅ |
| SO_REUSEPORT | ✅ | ✅ | ❌ |
| Epoll/Kqueue/IOCP | epoll | kqueue | IOCP |

See also: [I/O](./io.md), [Concurrency](./concurrency.md), [Platform Targets](../platform/linux.md)
