
import AccountChoice from "./pages/AccountChoice";
import CustomerProducts from "./pages/CustomerProducts";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerDashboard from "./pages/SellerDashboard";
import SellerLayout from "./pages/SellerLayout";
import SellerListings from "./pages/SellerListings";
import SellerOrders from "./pages/SellerOrders";
import SellerProducts from "./pages/SellerProducts";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<AccountChoice />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/customer" element={<CustomerProducts />} />
      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<SellerDashboard />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="listings" element={<SellerListings />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;
