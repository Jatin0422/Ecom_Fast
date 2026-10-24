
import AccountChoice from "./pages/AccountChoice";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerDashboard from "./pages/SellerDashboard";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<AccountChoice />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/seller/dashboard" element={<SellerDashboard />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
