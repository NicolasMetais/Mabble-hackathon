import Header from "./Header.jsx";
import LandingPage from "./LandingPage.jsx";
import Footer from "./Footer.jsx";
import SearchBar from "./SearchBar.jsx";
import TagList from "./TagList.jsx";
import blob from "./assets/blob.png"; // pour les blobs
import ApplyPage from "./ApplyPage/ApplyPage.jsx";
import Form from "./Form.jsx";
import Profil from "./Profil.jsx";
import Search from "./Search.jsx";
import Signup from "./Signup.jsx";
import CreateAccount from "./CreateAccount.jsx";
import { Routes, Route } from "react-router-dom";
import FooterApplyPage from "./FooterApplyPage.jsx";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/search" element={<Search />} />
        <Route path="/form" element={<Form />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/create-account" element={<CreateAccount />} />
      </Routes>
      <FooterApplyPage />
    </>
  );
}

export default App;
