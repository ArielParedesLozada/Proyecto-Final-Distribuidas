import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MePage from "./pages/MePage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/me" element={<MePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
