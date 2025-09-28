function notFoundHandler(req, res) {
  res.status(404).json({ message: "Not found" });
}


function errorHandler(err, req, res, next) {

  const status = err?.status && Number.isInteger(err.status) ? err.status : 500;
  const message = err?.message || "Server error";
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    console.error("[ERROR]", err);
  } else {
    console.error("[ERROR]", message);
  }

  const payload = { message };
  if (!isProd && err?.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

function registerGlobalHandlers({ server, mongooseConnection }) {
  function shutdown(exitCode = 1) {
    try {
      if (server && typeof server.close === "function") {
        server.close(() => {
          console.log("HTTP server closed");
          closeDbAndExit(exitCode);
        });
      } else {
        closeDbAndExit(exitCode);
      }
    } catch (_) {
      process.exit(exitCode);
    }
  }

  function closeDbAndExit(exitCode) {
    try {
      const conn = mongooseConnection || require("mongoose").connection;
      if (conn && conn.readyState !== 0) {
        conn.close(false).then(() => {
          console.log("MongoDB connection closed");
          process.exit(exitCode);
        }).catch(() => process.exit(exitCode));
      } else {
        process.exit(exitCode);
      }
    } catch (_) {
      process.exit(exitCode);
    }
  }

  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdown(1);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
    shutdown(1);
  });

  process.on("SIGINT", () => {
    console.log("Received SIGINT");
    shutdown(0);
  });

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM");
    shutdown(0);
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
  registerGlobalHandlers,
};


