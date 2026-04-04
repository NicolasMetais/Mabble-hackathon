import Header from "./Header.jsx";
import LandingPage from "./LandingPage/LandingPage.jsx";
import Footer from "./Footer.jsx";
import SearchBar from "./SearchBar.jsx";
import TagList from "./TagList.jsx";
import blob from "./assets/blob.png"; // pour les blobs
import ApplyPage from "./ApplyPage/ApplyPage.jsx";
import Form from "./Form.jsx";
import Profil from "./Profil.jsx";
import Search from "./Search.jsx";
import Login from "./Login.jsx";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/form" element={<Form />} />
        <Route path="/profil" element={<Profil />} />
      </Routes>
    </>
  );
}

export default App;
