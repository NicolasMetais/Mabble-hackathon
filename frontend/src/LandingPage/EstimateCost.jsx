import React, { useState } from "react";

const EstimateCost = () => {
  return (
    <div>
      <h1>Estimated Cost Breakdown</h1>
      <div style={styles.selectNeed}>
        <div>
          <p>Credits ⓘ</p>
          <p>Service fee ⓘ</p>
          <p>Platform fee ⓘ</p>
        </div>
        <div>
          <p>9 Credits</p>
          <p>$45</p>
          <p>$20</p>
        </div>
      </div>
      <hr style={styles.hrStyle}></hr>
      <div style={styles.selectNeed}>
        <p style={{fontSize: "2.5rem"}}>Total</p>
        <p style={{fontSize: "2.5rem"}}>9 Credits + $65</p>
      </div>
    </div>
  );
};

const styles = {
  selectNeed: {
    display: "flex",
    justifyContent: "space-evenly",
    gap: "40px",
    textAlign: "left",
    marginBottom: "30px",
    marginTop: "30px",
  },
  hrStyle: {
    border: "none",
    borderTop: "1px solid black",
    width: "50%",
    margin: "16px auto",
  },
};

export default EstimateCost;
