import session from "express-session";
import MongoDBStore from "connect-mongodb-session";

const MongoStore = MongoDBStore(session);

export function createSession({ key, secret, maxAge }) {
  const store = new MongoStore({
    uri: process.env.MONGO_URI,
    collection: "sessions",
  });
  store.on("error", (error) => console.error("Session store error:", error));
  return session({
    key,
    secret,
    saveUninitialized: false,
    resave: false,
    store,
    cookie: { maxAge },
  });
}

// Keep middleware scoped to registered routes, including chained HTTP methods.
export function withMiddleware(router, ...middleware) {
  return (path) => router.route(path).all(...middleware);
}

export function renderForm(view) {
  return (req, res) => res.render(view, { errMessage: req.query.errMessage });
}
