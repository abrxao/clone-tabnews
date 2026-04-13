function getOrigin() {
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000";
  }
  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://clone-tabnews-cyan-chi.vercel.app";
}

const webserver = { origin: getOrigin() };
export default webserver;
