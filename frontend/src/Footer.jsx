function Footer() {
  return (
    <footer
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        height: "13rem",
        paddingRight: "2rem",
      }}
    >
      <p>&copy; {new Date().getFullYear()} Mabble</p>
    </footer>
  );
}

export default Footer;
