
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { V2LanguageProvider } from "./app/contexts/V2LanguageContext.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <V2LanguageProvider>
      <App />
    </V2LanguageProvider>,
  );
