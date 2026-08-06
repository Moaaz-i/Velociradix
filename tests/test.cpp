#include "velociradix.hpp"

#include <arpa/inet.h>
#include <cstdio>
#include <cstring>
#include <string>
#include <thread>
#include <sys/socket.h>
#include <unistd.h>

using namespace velociradix;

static int failures = 0;
static const int PORT = 4900;

#define CHECK(cond, name)                                                          \
    do {                                                                           \
        if (cond) { std::printf("  ok   %s\n", name); }                            \
        else { std::printf("  FAIL %s\n", name); ++failures; }                     \
    } while (0)

static int connect_to() {
    int fd = ::socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(PORT);
    ::inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);
    int r = 0;
    while (::connect(fd, (sockaddr*)&addr, sizeof(addr)) < 0) {
        if (++r > 200) return -1;
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
    return fd;
}

static void send_all_raw(int fd, const std::string& s) {
    size_t sent = 0;
    while (sent < s.size()) {
        ssize_t n = ::send(fd, s.data() + sent, s.size() - sent, 0);
        if (n <= 0) break;
        sent += (size_t)n;
    }
}

// Reads exactly one HTTP response using Content-Length. Keeps leftover bytes
// in `buf` so pipelined responses on the same connection work correctly.
static std::string read_response(int fd, std::string& buf, int& status, bool& keep_alive) {
    std::string tmp(16384, '\0');
    while (buf.find("\r\n\r\n") == std::string::npos) {
        ssize_t n = ::recv(fd, tmp.data(), tmp.size(), 0);
        if (n <= 0) return buf;
        buf.append(tmp.data(), n);
    }
    size_t he = buf.find("\r\n\r\n");
    std::string head = buf.substr(0, he);
    std::sscanf(head.c_str(), "HTTP/1.1 %d", &status);
    keep_alive = head.find("Connection: keep-alive") != std::string::npos;
    size_t cl = 0;
    size_t p = head.find("Content-Length:");
    if (p == std::string::npos) p = head.find("content-length:");
    if (p != std::string::npos) {
        size_t e = head.find("\r\n", p);
        cl = std::stoul(head.substr(p + 16, e - p - 16));
    }
    while (buf.size() < he + 4 + cl) {
        ssize_t n = ::recv(fd, tmp.data(), tmp.size(), 0);
        if (n <= 0) break;
        buf.append(tmp.data(), n);
    }
    std::string body = buf.substr(he + 4, cl);
    buf.erase(0, he + 4 + cl);
    return body;
}

static std::string simple_request(const std::string& raw, int& status) {
    int fd = connect_to();
    if (fd < 0) { status = -1; return ""; }
    send_all_raw(fd, raw);
    std::string buf;
    bool ka = false;
    std::string body = read_response(fd, buf, status, ka);
    ::close(fd);
    return body;
}

int main() {
    App app;
    app.enable_cors();
    app.set_workers(2);

    std::string order;
    app.use([&order](Context&, const std::function<void()>& next) {
        order += "g1,";
        next();
        order += "g2,";
    });

    app.get("/hello", [](Context& ctx) { ctx.send("world"); });

    app.get("/api/products/:id", [](Context& ctx) {
        ctx.json(json::object({{"ok", "true"}, {"id", json::string(ctx.params["id"])}}));
    });

    app.get("/api/search", [](Context& ctx) {
        ctx.json(json::object({{"q", json::string(ctx.query("q"))}}));
    });

    app.get("/cookie", [](Context& ctx) {
        ctx.json(json::object({{"c", json::string(ctx.cookie("user"))}}));
    });

    app.get("/headers", [](Context& ctx) {
        const std::string* h = ctx.req.header("x-test");
        ctx.json(json::object({{"h", json::string(h ? *h : "")}}));
    });

    app.post("/echo", [](Context& ctx) {
        ctx.json(json::object({{"body", json::string(ctx.req.body)}}));
    });

    app.get("/redir", [](Context& ctx) {
        ctx.redirect("/hello", 302);
    });

    app.get("/mw", [&order](Context& ctx) { order += "h,"; ctx.send("done"); },
             { [&order](Context&, const std::function<void()>& next) {
                   order += "r,";
                   next();
               } });

    app.get("/boom", [](Context&) { throw std::runtime_error("kaboom"); });

    app.group("/api/v1", [](RouteGroup& g) {
        g.get("/ping", [](Context& ctx) { ctx.json(json::object({{"pong", "true"}})); });
    });

    app.get("/live", [](Context& ctx) {
        ctx.sse([](SseStream& s) {
            s.send_event("{\"tick\":1}", "update");
            s.close();
        });
    });

    std::thread server([&]() { app.listen(PORT, "127.0.0.1"); });
    (void)server; // join happens inside close()

    int status = 0;
    std::string body;

    std::printf("velociradix test suite\n");

    body = simple_request("GET /hello HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 200 && body == "world", "literal route GET /hello -> 200 'world'");

    body = simple_request("GET /api/products/42 HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 200 && body.find("\"id\":\"42\"") != std::string::npos, "param route captures :id");

    body = simple_request("GET /api/search?q=hi%20there HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 200 && body.find("\"q\":\"hi there\"") != std::string::npos, "query string decoded");

    body = simple_request("GET /api/v1/ping HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 200 && body.find("\"pong\":true") != std::string::npos, "route group with prefix");

    body = simple_request("GET /nope HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 404, "unknown route -> 404");

    app.get("/*", [](Context& ctx) { ctx.status(404).send("custom 404 wildcard"); });
    body = simple_request("GET /deep/nested/custom/404 HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 404 && body == "custom 404 wildcard", "wildcard /* route -> custom 404 wildcard handler");

    body = simple_request("OPTIONS /anything HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 204, "CORS preflight OPTIONS -> 204");

    body = simple_request("POST /echo HTTP/1.1\r\nHost: t\r\nContent-Length: 11\r\nConnection: close\r\n\r\nhello=world", status);
    CHECK(status == 200 && body.find("hello=world") != std::string::npos, "POST body via Content-Length");

    body = simple_request("GET /cookie HTTP/1.1\r\nHost: t\r\nCookie: user=velociradix\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 200 && body.find("\"c\":\"velociradix\"") != std::string::npos, "cookie parsed");

    body = simple_request("GET /headers HTTP/1.1\r\nHost: t\r\nX-Test: abcd\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 200 && body.find("\"h\":\"abcd\"") != std::string::npos, "header lookup case-insensitive");

    body = simple_request("GET /redir HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 302, "redirect status 302");

    order.clear();
    body = simple_request("GET /mw HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(order == "g1,r,h,g2,", "middleware order (global before route, next resumes)");

    body = simple_request("GET /boom HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n", status);
    CHECK(status == 500, "handler exception -> 500");

    // keep-alive: two requests on one connection
    {
        int fd = connect_to();
        CHECK(fd >= 0, "connect for keep-alive");
        send_all_raw(fd, "GET /hello HTTP/1.1\r\nHost: t\r\n\r\n"
                        "GET /api/products/7 HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n");
        int s1 = 0, s2 = 0;
        bool ka1 = false, ka2 = false;
        std::string buf;
        std::string b1 = read_response(fd, buf, s1, ka1);
        std::string b2 = read_response(fd, buf, s2, ka2);
        ::close(fd);
        CHECK(s1 == 200 && ka1 && b1 == "world", "keep-alive: first response on same connection");
        CHECK(s2 == 200 && !ka2 && b2.find("7") != std::string::npos, "keep-alive: second request, Connection: close honored");
    }

    // pipelining: two requests sent before any response
    {
        int fd = connect_to();
        CHECK(fd >= 0, "connect for pipelining");
        send_all_raw(fd, "GET /hello HTTP/1.1\r\nHost: t\r\n\r\nGET /hello HTTP/1.1\r\nHost: t\r\nConnection: close\r\n\r\n");
        int s1 = 0, s2 = 0;
        bool ka1 = false, ka2 = false;
        std::string buf;
        std::string b1 = read_response(fd, buf, s1, ka1);
        std::string b2 = read_response(fd, buf, s2, ka2);
        ::close(fd);
        CHECK(s1 == 200 && b1 == "world", "pipelining: response 1");
        CHECK(s2 == 200 && b2 == "world", "pipelining: response 2 in order");
    }

    // SSE
    {
        int fd = connect_to();
        CHECK(fd >= 0, "connect for SSE");
        send_all_raw(fd, "GET /live HTTP/1.1\r\nHost: t\r\n\r\n");
        std::string buf, tmp(4096, '\0');
        for (int i = 0; i < 200 && buf.find("event: update") == std::string::npos; ++i) {
            ssize_t n = ::recv(fd, tmp.data(), tmp.size(), 0);
            if (n <= 0) break;
            buf.append(tmp.data(), n);
        }
        ::close(fd);
        CHECK(buf.find("text/event-stream") != std::string::npos, "SSE content-type");
        CHECK(buf.find("event: update") != std::string::npos && buf.find("data:") != std::string::npos, "SSE event payload");
    }

    app.close();
    server.join();

    if (failures == 0) {
        std::printf("\nAll tests passed.\n");
        return 0;
    }
    std::printf("\n%d test(s) FAILED.\n", failures);
    return 1;
}
