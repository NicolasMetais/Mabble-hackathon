import React from "react";
import TagButton from "./TagButton.jsx";

export default function TagList() {
  const tags = [
    "Logo Design",
    "Motion Design",
    "UX/UI Design",
    "Branding",
    "Web Development",
    "3D & Animation",
  ];

  const handleClick = (tag) => {
    console.log("Tag cliqué :", tag);
  };

  return (
    <div style={styles.container}>
      {tags.map((tag, index) => (
        <TagButton
          key={index}
          label={tag}
          onClick={() => handleClick(tag)}
        />
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
    justifyContent: "center",
    marginTop: "20px",
    paddingBottom: "4rem"
  },
};