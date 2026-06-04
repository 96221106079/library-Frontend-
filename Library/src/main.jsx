

import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from "./App.jsx";

const clientId = "922347096609-t0p4ml148mtoic1jq4bn5fpd3915pvap.apps.googleusercontent.com"

createRoot(document.getElementById("root")).render(

  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>

);
